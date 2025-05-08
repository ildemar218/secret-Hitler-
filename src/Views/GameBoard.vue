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
      :politicas="politicas"
      :liberal-progress="liberalProgress"
      :fascist-progress="fascistProgress"
      :election-tracker="electionTracker"
      :num-players="numPlayers"
      @policy-effect="handleFascistEffect"
    />

    <!-- Botón de Robar Políticas -->
    <div v-if="partida?.fase === 'Legislacion' && currentUser?.id === currentPresident?.id" class="mt-4">
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
import { ref, onMounted, computed, watch } from "vue";
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
    const notification = ref({ 
      message: "Bienvenido a la partida", 
      type: "info" // Inicializar con un tipo válido
    });
    const players = ref([]);
    const showChancellorSelector = ref(false);
    const fascistProgress = ref(0);
    const liberalProgress = ref(0);
    const electionTracker = ref(1);
    const isGameOver = ref(false);
    const politicas = ref([]);
    const currentPresident = ref({ id: null, nombre: null });
    const numPlayers = computed(() => players.value.length);
    const currentUser = ref(null);
    const gameStarted = ref(false);
    const partida = ref(null);
    const currentChancellor = ref(null);
    const showVotingModal = ref(false);
    const votingPhase = ref(false);
    const gameResult = ref(null);

    // Escuchar jugadores en tiempo real y sincronizar estado local con Firebase
    onMounted(async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          currentUser.value = { 
            id: user.uid, 
            name: user.displayName 
          };
          console.log("Usuario actual:", currentUser.value);
        }

        // Escuchar cambios en los jugadores
        const unsubscribePlayers = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "jugadores_partida",
          (jugadores) => {
            const updatedPlayers = jugadores.map((jugador) => ({
              id: jugador.idJugador,
              nombre: jugador.nombreEnJuego,
              rol: jugador.rol,
              esta_vivo: jugador.estaVivo,
              ordenTurno: jugador.ordenTurno,
              imagen: jugador.imagen || '/public/image.png',
            }));

            players.value = updatedPlayers;
            console.log("Jugadores actualizados desde la base de datos:", players.value);
          }
        );

        // Escuchar cambios en el estado de la partida
        let previousPresidentId = null;

        const unsubscribeGame = onSnapshotDocument("partidas", props.codigoSala, (partidaData) => {
          console.log("[🔄 Snapshot] Datos actualizados de la partida:", partidaData);
          partida.value = partidaData;

          if (!partidaData) return;

          fascistProgress.value = partidaData.fascistProgress || 0;
          electionTracker.value = partidaData.electionTracker || 0;

          // Actualizar fase de votación basada en la fase de la partida
          if (partidaData.fase === "votacion") {
            votingPhase.value = true;
            
            // Obtener la votación activa de la subcolección votaciones
            const votacionRef = doc(db, "partidas", props.codigoSala, "votaciones", partidaData.votacion_activa);
            getDoc(votacionRef).then((docSnap) => {
              if (docSnap.exists()) {
                const votacionActiva = docSnap.data();
                const canciller = players.value.find(p => p.id === votacionActiva.candidato_id);
                if (canciller) {
                  currentChancellor.value = canciller;
                  // Mostrar el modal de votación para todos los jugadores
                  showVotingModal.value = true;
                  console.log("Mostrando modal de votación para:", currentUser.value?.nombre);
                }
              }
            });
          } else {
            // Ocultar el modal y limpiar el estado cuando no estamos en fase de votación
            showVotingModal.value = false;
            votingPhase.value = false;
            if (partidaData.fase !== "Legislacion") {
              currentChancellor.value = null;
            }
          }

          // Detectar cambio de presidente
          if (partidaData.id_presidente && partidaData.id_presidente !== previousPresidentId) {
            previousPresidentId = partidaData.id_presidente;

            const president = players.value.find(player => player.id === partidaData.id_presidente);

            if (president) {
              currentPresident.value = president;

              notification.value = {
                message: `¡${president.nombre} es el Presidente actual!`,
                type: "info"
              };

              // Mostrar el selector solo si el jugador actual es el presidente
              showChancellorSelector.value = currentUser.value && currentUser.value.id === president.id;
            }
          }

          if (partidaData.estado === "iniciada" && !gameStarted.value) {
            console.log("[🎮 Partida iniciada]");
            gameStarted.value = true;
            startGame();
          }
        });

        // Escuchar votaciones activas
        const unsubscribeVotaciones = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "votaciones",
          (votaciones) => {
            const votacionActiva = votaciones[votaciones.length - 1];
            if (votacionActiva && !votacionActiva.aprobada) {
              showVotingModal.value = true;
              votingPhase.value = true;
              currentChancellor.value = players.value.find(p => p.id === votacionActiva.candidato_id);
            } else {
              
              showVotingModal.value = false;
      votingPhase.value = false;

    
            }
          }
        );

        return () => {
          unsubscribePlayers();
          unsubscribeGame();
          unsubscribeVotaciones();
        };
      } catch (error) {
        console.error("Error:", error);
        notification.value = { message: "Error al cargar la partida", type: "danger" };
      }
    });

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
        console.log("Votacion activa", votacionActiva)
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
              fase: yesVotes > noVotes ? "Legislacion" : "seleccion_presidente",
              id_canciller: yesVotes > noVotes ? currentChancellor.value.id : null,
              votacion_activa: null
            });

            if (yesVotes > noVotes) {
              // El canciller fue aprobado
              const esPresidente = currentUser.value?.id === currentPresident.value?.id;

  if (esPresidente) {
    notification.value = {
      message: "Selección de políticas: fase de legislación",
      type: "info"
    };
    console.log("[🗳️ Legislación] Presidente actual selecciona políticas");
  } 

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
          notification.value = {
            message: "No hay suficientes políticas en el mazo",
            type: "warning"
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


      } catch (error) {
        console.error("Error al robar políticas:", error);
        notification.value = {
          message: "Error al robar políticas",
          type: "danger"
        };
      }
    };

    return {
      notification,
      players,
      showChancellorSelector,
      fascistProgress,
      liberalProgress,
      electionTracker,
      isGameOver,
      politicas,
      currentPresident,
      numPlayers,
      currentUser,
      partida,
      currentChancellor,
      showVotingModal,
      votingPhase,
      gameResult,
      handleFascistEffect,
      handleChancellorSelected,
      handleVote,
      handleTurnChanged,
      resetGame,
      startGame,
      drawPolicies
    };
  },
};
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
}

.decks-container {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
}

.game-over {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
}
</style>
