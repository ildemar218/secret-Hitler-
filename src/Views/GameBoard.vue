<template>
  <div
    class="container-fluid text-center mt-4 game-container"
    style="max-width: 1400px; margin: 0 auto"
  >
    <!-- Área de notificaciones -->
    <NotificationArea
      :message="notification.message"
      :type="notification.type"
    />

    <!-- Área de Jugadores -->
    <PlayersArea
      :players="players"
      :current-president="currentPresident"
      :current-chancellor="currentChancellor"
    />

    <!-- Contenedor de Mazos -->
    <div class="decks-container mb-4">
      <div class="d-flex justify-content-center">
        <NextTurnButton
          v-if="currentUser && currentPresident && currentUser.id === currentPresident.id"
          :codigo-sala="codigoSala"
          :players="players"
          :current-president="currentPresident"
          @turn-changed="handleTurnChanged"
        />
      </div>
    </div>

    <!-- Selector de Canciller -->
    <PresidentCansillerSelector
      v-if="showChancellorSelector"
      :players="players.filter(p => p.id !== currentPresident?.id && p.esta_vivo)"
      :presidentId="currentPresident?.id"
      @chancellor-selected="handleChancellorSelected"
    />

    <!-- Área de Políticas -->
    <PolicyArea
      :politicas="politicasActivas"
      :liberal-progress="liberalProgress"
      :fascist-progress="fascistProgress"
      :election-tracker="electionTracker"
      :num-players="numPlayers"
      :cartas-descartadas="totalCartasDescartadas"
      @policy-effect="handleFascistEffect"
    />

    <!-- Botón de Robar Políticas -->
    <div v-if="showDrawPoliciesButton" class="mt-4">
      <button class="btn btn-primary" @click="drawPolicies">
        Robar 3 Cartas
      </button>
    </div>

    <!-- Estado del Juego -->
    <div v-if="isGameOver" class="game-over mt-4">
      <h2 :class="gameResult === 'liberal' ? 'text-primary' : 'text-danger'">
        {{
          gameResult === "liberal"
            ? "¡Los Liberales han ganado!"
            : "¡Los Fascistas han ganado!"
        }}
      </h2>
      <button class="btn btn-info mt-3" @click="resetGame">Nueva Partida</button>
    </div>

    <!-- Modal de Votación -->
    <VotingModal
      v-if="showVotingModal && currentChancellor"
      :show="showVotingModal"
      :chancellor-name="currentChancellor?.nombre || ''"
      :current-user-id="currentUser?.id"
      @vote-submitted="handleVote"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import NotificationArea from "../components/NotificationArea.vue";
import PlayersArea from "../components/PlayersArea.vue";
import PresidentCansillerSelector from "../components/PresidentCansillerSelector.vue";
import PolicyArea from "../components/PolicyArea.vue";
import NextTurnButton from "../components/NextTurnButton.vue";
import VotingModal from "../components/VotingModal.vue";
import { onSnapshotSubcollection, updateDocument, createSubCollection, onSnapshotDocument } from "../firebase/servicesFirebase";
import { AuthService } from '../firebase/auth.js';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/firebase.js';
import { 
  createVotacion, 
  addVoto, 
  getVotos, 
  updateVotacion, 
  onVotosChange 
} from "../firebase/servicesFirebase";

export default {
  props: ["codigoSala"],
  components: {
    NotificationArea,
    PlayersArea,
    PresidentCansillerSelector,
    PolicyArea,
    NextTurnButton,
    VotingModal
  },
  setup(props) {
    // Estado base
    const notification = ref({ message: "Bienvenido a la partida", type: "info" });
    const players = ref([]);
    const showChancellorSelector = ref(false);
    const fascistProgress = ref(0);
    const liberalProgress = ref(0);
    const electionTracker = ref(1);
    const isGameOver = ref(false);
    const politicas = ref([]);
    const currentPresident = ref({ id: null, nombre: null });
    const currentUser = ref(null);
    const gameStarted = ref(false);
    const partida = ref(null);
    const currentChancellor = ref(null);
    const showVotingModal = ref(false);
    const votingPhase = ref(false);
    const gameResult = ref(null);

    // Computed properties
    const numPlayers = computed(() => players.value.length);
    
    const totalCartasDescartadas = computed(() => {
      // Suma las políticas liberales y fascistas jugadas
      return fascistProgress.value + liberalProgress.value;
    });

    const politicasActivas = computed(() => {
      return politicas.value.filter(p => p.estado === "seleccion");
    });

    const showDrawPoliciesButton = computed(() => {
      return partida.value?.fase === 'seleccion_politicas' && 
             currentUser.value?.id === currentPresident.value?.id;
    });

    // Lógica de montaje y observadores
    onMounted(async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          currentUser.value = { 
            id: user.uid, 
            name: user.displayName 
          };
        }

        // Escuchar cambios en los jugadores
        const unsubscribePlayers = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "jugadores_partida",
          (jugadores) => {
            players.value = jugadores.map((jugador) => ({
              id: jugador.idJugador,
              nombre: jugador.nombreEnJuego,
              rol: jugador.rol,
              esta_vivo: jugador.estaVivo,
              ordenTurno: jugador.ordenTurno,
              imagen: jugador.imagen || '/public/image.png',
            }));
          }
        );

        // Escuchar cambios en el estado de la partida
        let previousPresidentId = null;

        const unsubscribeGame = onSnapshotDocument("partidas", props.codigoSala, (partidaData) => {
          partida.value = partidaData;

          if (!partidaData) return;

          // Actualizar contadores
          fascistProgress.value = partidaData.fascistProgress || 0;
          liberalProgress.value = partidaData.liberalProgress || 0;
          electionTracker.value = partidaData.electionTracker || 0;

          // Manejar fase de votación
          if (partidaData.fase === "votacion") {
            handleVotingPhase(partidaData);
          } else {
            cleanupVotingPhase();
          }

          // Detectar cambio de presidente
          if (partidaData.id_presidente !== previousPresidentId) {
            handlePresidentChange(partidaData.id_presidente);
            previousPresidentId = partidaData.id_presidente;
          }

          // Iniciar partida si es necesario
          if (partidaData.estado === "iniciada" && !gameStarted.value) {
            gameStarted.value = true;
            startGame();
          }
        });

        // Escuchar cambios en las políticas
        const unsubscribePolicies = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "politicas",
          (politicasData) => {
            politicas.value = politicasData;
          }
        );

        return () => {
          unsubscribePlayers();
          unsubscribeGame();
          unsubscribePolicies();
        };
      } catch (error) {
        console.error("Error:", error);
        notification.value = { message: "Error al cargar la partida", type: "danger" };
      }
    });

    // Funciones auxiliares
    const handleVotingPhase = async (partidaData) => {
      votingPhase.value = true;
      if (partidaData.votacion_activa) {
        const votacionRef = doc(db, "partidas", props.codigoSala, "votaciones", partidaData.votacion_activa);
        const docSnap = await getDoc(votacionRef);
        if (docSnap.exists()) {
          const votacionActiva = docSnap.data();
          const canciller = players.value.find(p => p.id === votacionActiva.candidato_id);
          if (canciller) {
            currentChancellor.value = canciller;
            showVotingModal.value = true;
          }
        }
      }
    };

    const cleanupVotingPhase = () => {
      showVotingModal.value = false;
      votingPhase.value = false;
      if (partida.value?.fase !== "seleccion_politicas") {
        currentChancellor.value = null;
      }
    };

    const handlePresidentChange = (newPresidentId) => {
      const president = players.value.find(player => player.id === newPresidentId);
      if (president) {
        currentPresident.value = president;
        notification.value = {
          message: `¡${president.nombre} es el Presidente actual!`,
          type: "info"
        };
        showChancellorSelector.value = currentUser.value?.id === president.id;
      }
    };

    const handleFascistEffect = () => {
      console.log("Efecto fascista activado");
    };

    const handleChancellorSelected = async (chancellor) => {
      try {
        // Limpiar el canciller anterior
        currentChancellor.value = null;

        // Crear una nueva votación
        const votacionData = {
          presidente_id: currentPresident.value.id,
          candidato_id: chancellor.id,
          tipo: 'canciller',
          estado: 'activa'
        };

        // Crear la votación en la subcolección votaciones
        const votacionId = await createVotacion(props.codigoSala, votacionData);

        // Actualizar el canciller actual ANTES de actualizar la fase
        currentChancellor.value = {
          id: chancellor.id,
          nombre: chancellor.nombre
        };

        // Actualizar la fase en la partida
        await updateDocument("partidas", props.codigoSala, {
          fase: "votacion",
          id_canciller: null, // Limpiar el canciller anterior
          votacion_activa: votacionId
        });
        
        // Solo ocultar el selector de canciller
        showChancellorSelector.value = false;

        notification.value = { 
          message: `¡${chancellor.nombre} ha sido nominado como Canciller! ¡Es hora de votar!`, 
          type: "info" 
        };
      } catch (error) {
        console.error("Error al seleccionar canciller:", error);
        notification.value = { 
          message: "Error al seleccionar canciller", 
          type: "danger" 
        };
      }
    };

    const handleVote = async (voteData) => {
      try {
        if (!currentUser.value || !currentUser.value.id) {
          throw new Error("Usuario no autenticado");
        }

        // Ocultar el modal inmediatamente
        showVotingModal.value = false;
        votingPhase.value = false;

        // Obtener la votación activa
        const votacionActiva = partida.value.votacion_activa;
        if (!votacionActiva) {
          throw new Error("No hay votación activa");
        }

        // Verificar si el usuario ya ha votado
        const votos = await getVotos(props.codigoSala, votacionActiva);
        const votoExistente = votos.find(v => v.jugador_id === currentUser.value.id);

        if (votoExistente) {
          notification.value = {
            message: "Ya has emitido tu voto",
            type: "warning"
          };
          return;
        }

        // Agregar el voto
        await addVoto(props.codigoSala, votacionActiva, {
          jugador_id: currentUser.value.id,
          voto: voteData.vote
        });

        notification.value = {
          message: "Tu voto ha sido registrado",
          type: "success"
        };

        // Escuchar los votos en tiempo real
        const unsubscribe = onVotosChange(props.codigoSala, votacionActiva, async (votos) => {
          if (votos.length === players.value.length) {
            const yesVotes = votos.filter(v => v.voto === 'ja').length;
            const noVotes = votos.filter(v => v.voto === 'nein').length;

            // Actualizar el estado de la votación
            await updateVotacion(props.codigoSala, votacionActiva, {
              estado: 'completada',
              resultado: yesVotes > noVotes ? 'aprobada' : 'rechazada',
              votos_ja: yesVotes,
              votos_nein: noVotes
            });

            // Actualizar la fase y el canciller
            await updateDocument("partidas", props.codigoSala, {
              fase: yesVotes > noVotes ? "seleccion_politicas" : "seleccion_presidente",
              id_canciller: yesVotes > noVotes ? currentChancellor.value.id : null,
              votacion_activa: null
            });

            if (yesVotes > noVotes) {
              // El canciller fue aprobado
              notification.value = {
                message: "¡El Canciller ha sido aprobado!",
                type: "success"
              };

              // Iniciar la selección de políticas
              drawPolicies();
            } else {
              // El canciller fue rechazado
              notification.value = {
                message: "El Canciller ha sido rechazado.",
                type: "danger"
              };

              // Reiniciar el proceso
              currentChancellor.value = null;
              electionTracker.value++;
              
              if (electionTracker.value >= 3) {
                // Si se alcanza el límite de elecciones fallidas, promulgar la política superior
                const topPolicy = politicas.value[0];
                await enactPolicy(topPolicy.tipo_carta);
                electionTracker.value = 0;
              }
            }

            // Cancelar la suscripción
            unsubscribe();
          }
        });

      } catch (error) {
        console.error("Error al procesar el voto:", error);
        notification.value = {
          message: error.message || "Error al procesar el voto",
          type: "danger"
        };
      }
    };

    const handleTurnChanged = (newPresident) => {
      currentPresident.value = newPresident;
      notification.value = {
        message: `¡${newPresident.nombre} es el nuevo Presidente!`,
        type: "info"
      };
    };

    const resetGame = async () => {
      try {
        await updateDocument("partidas", props.codigoSala, {
          estado: "pendiente",
          fascistProgress: 0,
          liberalProgress: 0,
          turno_actual: 0,
          ganador: null,
        });
        fascistProgress.value = 0;
        liberalProgress.value = 0;
        isGameOver.value = false;
        notification.value = { message: "La partida ha sido reiniciada.", type: "info" };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const startGame = async () => {
      try {
        // Obtener el primer jugador (ordenTurno: 1) para ser el presidente inicial
        const primerJugador = players.value.find(p => p.ordenTurno === 1);
        
        if (!primerJugador) {
          throw new Error("No se encontró el primer jugador");
        }

        // Actualizar la partida con el presidente inicial
        await updateDocument("partidas", props.codigoSala, {
          id_presidente: primerJugador.id,
          fase: "postulacion",
          estado: "iniciada"
        });

        notification.value = {
          message: `¡La partida ha comenzado! ${primerJugador.nombre} es el primer Presidente.`,
          type: "success"
        };

        // Actualizar el presidente actual
        currentPresident.value = primerJugador;
        
        // Mostrar el selector de canciller si el usuario actual es el presidente
        if (currentUser.value && currentUser.value.id === primerJugador.id) {
          showChancellorSelector.value = true;
        }

      } catch (error) {
        console.error("Error al iniciar la partida:", error);
        notification.value = {
          message: "Error al iniciar la partida",
          type: "danger"
        };
      }
    };

    const drawPolicies = async () => {
      try {
        // Obtener 3 políticas del mazo
        const politicasRef = collection(db, "partidas", props.codigoSala, "politicas");
        const q = query(politicasRef, where("estado", "==", "mazo"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty || snapshot.docs.length < 3) {
          // Si no hay suficientes cartas, reiniciar el mazo
          notification.value = {
            message: "Reiniciando el mazo con las cartas descartadas...",
            type: "info"
          };

          // Obtener todas las cartas descartadas
          const descartadasQuery = query(politicasRef, where("estado", "==", "descartada"));
          const descartadasSnap = await getDocs(descartadasQuery);
          const cartasDescartadas = descartadasSnap.docs;

          // Mezclar las cartas descartadas
          const cartasMezcladas = cartasDescartadas.sort(() => Math.random() - 0.5);

          // Devolver las cartas al mazo
          const batch = writeBatch(db);
          cartasMezcladas.forEach((carta) => {
            const cartaRef = doc(politicasRef, carta.id);
            batch.update(cartaRef, { estado: "mazo" });
          });
          await batch.commit();

          // Intentar obtener las cartas nuevamente
          const nuevoSnapshot = await getDocs(q);
          if (nuevoSnapshot.empty || nuevoSnapshot.docs.length < 3) {
            notification.value = {
              message: "Error: No hay suficientes cartas disponibles",
              type: "error"
            };
            return;
          }

          // Continuar con las cartas del mazo reiniciado
          const politicasSeleccionadas = nuevoSnapshot.docs.slice(0, 3).map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Actualizar el estado de las políticas seleccionadas
          for (const politica of politicasSeleccionadas) {
            await updateDocument("partidas", props.codigoSala, {
              [`politicas.${politica.id}.estado`]: "seleccion"
            });
          }

          await updateDocument("partidas", props.codigoSala, {
            fase: "seleccion_presidente",
            politicas_seleccionadas: politicasSeleccionadas.map(p => p.id)
          });

          notification.value = {
            message: "Mazo reiniciado. Has robado 3 cartas. Selecciona 2 para el canciller.",
            type: "success"
          };
          return;
        }

        // Tomar las primeras 3 políticas
        const politicasSeleccionadas = snapshot.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Actualizar el estado de las políticas a "seleccion"
        for (const politica of politicasSeleccionadas) {
          await updateDocument("partidas", props.codigoSala, {
            [`politicas.${politica.id}.estado`]: "seleccion"
          });
        }

        // Actualizar la fase de la partida
        await updateDocument("partidas", props.codigoSala, {
          fase: "seleccion_presidente",
          politicas_seleccionadas: politicasSeleccionadas.map(p => p.id)
        });

        notification.value = {
          message: "Has robado 3 cartas. Selecciona 2 para el canciller.",
          type: "info"
        };

      } catch (error) {
        console.error("Error al robar políticas:", error);
        notification.value = {
          message: "Error al robar políticas",
          type: "danger"
        };
      }
    };

    return {
      // Estado
      notification,
      players,
      showChancellorSelector,
      fascistProgress,
      liberalProgress,
      electionTracker,
      isGameOver,
      politicasActivas,
      currentPresident,
      numPlayers,
      currentUser,
      partida,
      currentChancellor,
      showVotingModal,
      votingPhase,
      gameResult,
      totalCartasDescartadas,
      showDrawPoliciesButton,

      // Métodos
      handleFascistEffect,
      handleChancellorSelected,
      handleVote,
      handleTurnChanged,
      resetGame,
      startGame,
      drawPolicies
    };
  }
};
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 2rem 1rem;
}

.decks-container {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.game-over {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .game-container {
    padding: 1rem 0.5rem;
  }
}
</style>
