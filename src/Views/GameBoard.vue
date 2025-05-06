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

    <!-- Contenedor de Jugadores -->
    <div class="players-container mb-4">
      <div v-if="players.length > 0" class="d-flex justify-content-center">
        <PlayerContainer
          v-for="player in players"
          :key="player.id"
          :nombre="player.nombre"
          :rol="player.id === currentPresident?.id ? 'Presidente' : player.rol"
          :imagen="player.imagen"
        />
      </div>
      <div v-else>
        <p>No hay jugadores disponibles.</p>
      </div>
    </div>

    <!-- Contenedor de Mazos -->
    <div class="decks-container mb-4">
      <div class="d-flex justify-content-center">
        <button 
          v-if="currentPresident && currentPresident.id === currentUser?.id"
          class="btn btn-warning mx-3"
          @click="finalizarPresidencia"
        >
          Finalizar Presidencia
        </button>
      </div>
    </div>

    <!-- Selector de Canciller -->
    <PresidentCansillerSelector
  v-if="showChancellorSelector"
  :players="players.filter(p => p.id !== currentPresident?.id && p.esta_vivo)"
  :presidentId="currentPresident?.id"
  @chancellor-selected="handleChancellorSelected"
/>

    <!-- Tablero Liberal -->
    <div class="mb-4">
      <div class="d-flex justify-content-center">
        <LiberalCard
          :passedPolicies="liberalProgress"
          :trackerPosition="electionTracker"
        />
      </div>
    </div>

    <!-- Tablero Fascista -->
    <div class="mb-4">
      <div class="d-flex justify-content-center">
        <FascistCard
          v-if="fascistProgress >= 0 && fascistProgress <= 6 && electionTracker >= 0 && electionTracker <= 3"
          :passedPolicies="fascistProgress"
          :trackerPosition="electionTracker"
          :currentPlayerCount="numPlayers"
          @policy-effect="handleFascistEffect"
        />
      </div>
    </div>

    <!-- Área de Políticas -->
    <PolicyArea
      :politicas="politicas"
      :is-game-over="isGameOver"
      @draw-policies="drawPolicies"
      @president-policy-selected="handlePresidentPolicySelection"
      @chancellor-policy-selected="handleChancellorPolicySelection"
    />

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
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import PlayerContainer from "../components/PlayerContainer.vue";
import DecksEndTermButton from "../components/DecksEndTermButton.vue";
import PresidentCansillerSelector from "../components/PresidentCansillerSelector.vue";
import FascistCard from "../components/FascistCard.vue";
import LiberalCard from "../components/LiberalCard.vue";
import NotificationArea from "../components/NotificationArea.vue";
import PolicyArea from "../components/PolicyArea.vue";
import { onSnapshotSubcollection, updateDocument, createSubCollection, enrichDataWithField, readSubcollection, readDocumentById, onSnapshotDocument, updateSubcollectionDocument } from "../firebase/servicesFirebase"; // Importación de función para escuchar cambios
import { AuthService } from '../firebase/auth.js';
import { writeBatch, doc } from "firebase/firestore";

export default {
  props: ["codigoSala"],
  components: {
    PlayerContainer,
    DecksEndTermButton,
    PresidentCansillerSelector,
    FascistCard,
    LiberalCard,
    NotificationArea,
    PolicyArea
  },
  setup(props) {
    const notification = ref({ message: "", type: "" });
    const players = ref([]); // Lista de jugadores
    const showChancellorSelector = ref(false);
    const fascistProgress = ref(0);
    const liberalProgress = ref(0);
    const electionTracker = ref(1); // Cambiar el valor inicial a 1
    const isGameOver = ref(false);
    const drawnPolicies = ref([]);
    const showPolicyModal = ref(false);
    const politicasParaCanciller = ref([]);
    const currentPresident = ref({ id: null, nombre: null });
    const currentChancellor = ref(null);
    const numPlayers = computed(() => players.value.length); // Número de jugadores
    const showFascistPower = ref(false); // Mostrar poderes fascistas
    const currentUser = ref(null);
    const gameStarted = ref(false); // Bandera para evitar múltiples inicios

    // Escuchar jugadores en tiempo real y sincronizar estado local con Firebase
    onMounted(async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          currentUser.value = { id: user.uid, name: user.displayName };
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

        const unsubscribeGame = onSnapshotDocument("partidas", props.codigoSala, (partida) => {
  console.log("[🔄 Snapshot] Datos actualizados de la partida:", partida);

  if (!partida) return;

  fascistProgress.value = partida.fascistProgress || 0;
  electionTracker.value = partida.electionTracker || 0;

  // Detectar cambio de presidente
  console.log(`[🧠 Depuración] id_presidente actual: ${partida.id_presidente}, id anterior: ${previousPresidentId}`);
  
  if (partida.id_presidente && partida.id_presidente !== previousPresidentId) {
    console.log("[⚡ Cambio detectado] Se actualizó el presidente.");
    previousPresidentId = partida.id_presidente;

    const president = players.value.find(player => player.id === partida.id_presidente);

    if (president) {
      console.log(`[👔 Presidente asignado] ${president.nombre} (${president.id})`);
      currentPresident.value = president;

      notification.value = {
        message: `¡${president.nombre} es el Presidente actual!`,
        type: "info"
      };


      console.log("Current playeR: ", currentUser.value);

      // Mostrar el selector solo si el jugador actual es el presidente
      const esPresidenteActual = currentUser.value.id === president.id;
      console.log(`[🔍 Usuario actual es presidente: ${esPresidenteActual}]`);

      // Mostrar el selector de canciller solo si el usuario actual es presidente
      showChancellorSelector.value = esPresidenteActual;
      console.log(`[🔔 showChancellorSelector: ${showChancellorSelector.value}]`);
    } else {
      console.warn(`[⚠️ No se encontró el jugador con ID ${partida.id_presidente}]`);
    }
  }

  // Solo actualizamos visualmente el canciller, pero no cerramos el selector aquí
  if (partida.id_canciller) {
    console.log(`[ℹ️ Info] Ya hay un canciller asignado con ID: ${partida.id_canciller}`);
    const chancellor = players.value.find(player => player.id === partida.id_canciller);
    currentChancellor.value = chancellor || null;
  }

  if (partida.estado === "iniciada" && !gameStarted.value) {
    console.log("[🎮 Partida iniciada]");
    gameStarted.value = true;
    startGame();
  }
});





        return () => {
          unsubscribePlayers();
          unsubscribeGame();
        };
      } catch (error) {
        console.error("Error:", error);
        notification.value = { message: "Error al cargar la partida", type: "danger" };
      }
    });

    const politicas = ref([
      { tipo_carta: "liberal" },
      { tipo_carta: "fascista" },
      { tipo_carta: "liberal" },
    ]);

    const handleFascistEffect = () => {
      console.log("Efecto fascista activado");
    };

    const drawPolicies = async () => {
      try {
        if (politicas.value.length < 3) {
          console.error("No hay suficientes cartas en el mazo.");
          return;
        }

        drawnPolicies.value = politicas.value.slice(0, 3);
        politicas.value = politicas.value.slice(3);

        await updateDocument("partidas", props.codigoSala, {
          politicas_robadas: drawnPolicies.value,
          politicas_restantes: politicas.value,
        });

        showPolicyModal.value = true; // Mostrar el modal de selección
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const enactPolicy = async (policyType) => {
      try {
        if (policyType === "fascista") {
          fascistProgress.value += 1;
        } else if (policyType === "liberal") {
          liberalProgress.value += 1;
        }

        await updateDocument("partidas", props.codigoSala, {
          fascistProgress: fascistProgress.value,
          liberalProgress: liberalProgress.value,
        });

        await checkGameOver();
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const checkGameOver = async () => {
      try {
        if (fascistProgress.value >= 6) {
          isGameOver.value = true;
          await updateDocument("partidas", props.codigoSala, {
            estado: "finalizada",
            ganador: "fascistas",
          });
          notification.value = { message: "¡Los Fascistas han ganado!", type: "danger" };
        } else if (liberalProgress.value >= 5) {
          isGameOver.value = true;
          await updateDocument("partidas", props.codigoSala, {
            estado: "finalizada",
            ganador: "liberales",
          });
          notification.value = { message: "¡Los Liberales han ganado!", type: "success" };
        }
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
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

    const handleChancellorSelected = async (chancellor) => {
      try {
        currentChancellor.value = chancellor;

        // Actualizar el estado local y en Firebase
        players.value = players.value.map((player) =>
          player.id === chancellor.id ? { ...player, rol: "canciller" } : player
        );
        await updateDocument("partidas", props.codigoSala, {
          id_canciller: chancellor.id,
        });

        console.log("Canciller seleccionado:", chancellor);

        showChancellorSelector.value = false; // Ocultar el selector de canciller
        notification.value = { message: `¡${chancellor.nombre} ha sido nominado como Canciller!`, type: "info" };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const handlePresidentPolicySelection = async (selectedPolicy) => {
      try {
        const remainingPolicies = drawnPolicies.value.filter(policy => policy.tipo_carta !== selectedPolicy);

        await updateDocument("partidas", props.codigoSala, {
          politicas_para_canciller: remainingPolicies,
        });

        politicasParaCanciller.value = remainingPolicies;
        notification.value = { message: "El Canciller debe seleccionar una política.", type: "info" };
        showPolicyModal.value = false;
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const handleChancellorPolicySelection = async (selectedPolicy) => {
      try {
        if (selectedPolicy === "fascista") {
          fascistProgress.value += 1;
        } else if (selectedPolicy === "liberal") {
          liberalProgress.value += 1;
        }

        await updateDocument("partidas", props.codigoSala, {
          fascistProgress: fascistProgress.value,
          liberalProgress: liberalProgress.value,
        });

        await checkGameOver();

        politicasParaCanciller.value = [];
        notification.value = { message: `¡Se ha promulgado una política ${selectedPolicy}!`, type: "success" };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const finalizarPresidencia = async () => {
      try {
        console.log("[🛑 Finalizando presidencia...]");

        // Verificar que el usuario actual es el presidente
        if (!currentPresident.value || currentPresident.value.id !== currentUser.value?.id) {
          notification.value = { 
            message: "Solo el presidente actual puede finalizar la presidencia", 
            type: "danger" 
          };
          return;
        }

        // Ordenar jugadores por ordenTurno
        const sortedPlayers = [...players.value].sort((a, b) => a.ordenTurno - b.ordenTurno);
        const totalJugadores = sortedPlayers.length;
        console.log(`[🔢 Jugadores ordenados]: ${sortedPlayers.map(p => `${p.nombre} (${p.ordenTurno})`).join(", ")}`);
        console.log(`[📊 Total de jugadores]: ${totalJugadores}`);

        // Obtener el turno del presidente actual
        const currentTurno = currentPresident.value.ordenTurno;
        console.log(`[👔 Turno actual del presidente]: ${currentTurno}`);

        // Calcular el próximo turno, reiniciando a 1 si se excede
        let nextTurno = currentTurno + 1;
        if (nextTurno > totalJugadores) {
          nextTurno = 1;
          console.log("[🔁 Reinicio de turno] Se reinicia a 1");
        } else {
          console.log(`[➡️ Próximo turno calculado]: ${nextTurno}`);
        }

        // Buscar al siguiente presidente
        const nextPresident = sortedPlayers.find(p => p.ordenTurno === nextTurno);
        if (!nextPresident) {
          console.error("❌ No se pudo encontrar el siguiente presidente.");
          return;
        }

        console.log(`[✅ Nuevo presidente]: ${nextPresident.nombre} (${nextPresident.id})`);

        // Actualizar currentPresident con el nuevo presidente
        currentPresident.value = nextPresident;
        console.log(`[🔄 Presidente actualizado]: ${currentPresident.value.nombre} (${currentPresident.value.id})`);

        // Actualizar la partida en Firebase
        await updateDocument("partidas", props.codigoSala, {
          turnoJugadorId: nextPresident.id,
          turnoActual: nextTurno
        });

        console.log(`[📥 Firebase actualizado] turnoJugadorId: ${nextPresident.id}, turnoActual: ${nextTurno}`);

        notification.value = {
          message: `¡${nextPresident.nombre} es el nuevo Presidente!`,
          type: "info"
        };

        // Ocultar el selector de canciller
        showChancellorSelector.value = false;
        console.log("[🙈 Selector de canciller ocultado]");

      } catch (error) {
        console.error("❗ Error al finalizar presidencia:", error);
        notification.value = {
          message: "Error al finalizar la presidencia",
          type: "danger"
        };
      }
    };

    const selectRandomPresident = async () => {
      try {
        // Solo seleccionar aleatoriamente si es el inicio de la partida
        if (!currentPresident.value) {
          // Ordenar jugadores por ordenTurno
          const sortedPlayers = [...players.value].sort((a, b) => a.ordenTurno - b.ordenTurno);
          const randomIndex = Math.floor(Math.random() * sortedPlayers.length);
          const selectedPresident = sortedPlayers[randomIndex];

          if (!selectedPresident) {
            console.error("No se pudo seleccionar un presidente.");
            return;
          }

          // Actualizar el turnoJugadorId en la partida
          await updateDocument("partidas", props.codigoSala, {
            turnoJugadorId: selectedPresident.id,
            turnoActual: selectedPresident.ordenTurno
          });

          console.log("Presidente inicial seleccionado:", selectedPresident);
        }
      } catch (error) {
        console.error("Error al seleccionar presidente:", error);
      }
    };

    const handleVote = async (playerId, vote) => {
      try {
        // Guardar el voto en Firebase
        await createSubCollection("partidas", props.codigoSala, "votaciones", {
          id_jugador: playerId,
          voto: vote,
        });

        // Escuchar los votos en tiempo real
        const unsubscribe = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "votaciones",
          (votos) => {
            const totalVotes = votos.length;
            const yesVotes = votos.filter((v) => v.voto === "ja").length;

            if (totalVotes === players.value.length - 1) {
              // Todos los jugadores han votado
              if (yesVotes > Math.floor(players.value.length / 2)) {
                notification.value = { message: "¡El Canciller ha sido aprobado!", type: "success" };
                startPolicySelection(); // Iniciar la selección de políticas
              } else {
                notification.value = { message: "El Canciller ha sido rechazado.", type: "danger" };
                resetTurn(); // Reiniciar el turno
              }
            }
          }
        );

        return () => unsubscribe(); // Cancelar la suscripción al desmontar
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const createTurn = async (numeroTurno, idPresidenteJugador) => {
      try {
        const turnoData = {
          numero: numeroTurno,
          id_presidente_jugador: idPresidenteJugador,
          id_canciller_jugador: null,
          resultado: null,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: null,
        };
        await createSubCollection("partidas", props.codigoSala, "turnos", turnoData);
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const updatePolicyState = async (policyId, newState) => {
      try {
        await updateSubcollectionDocument(
          "partidas",
          props.codigoSala,
          "politicas",
          policyId,
          { estado: newState }
        );
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = { message: "Se ha excedido el límite de Firestore. Inténtalo más tarde.", type: "danger" };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const assignRoles = async () => {
      try {
        if (players.value.length !== 5) {
          notification.value = { message: "La partida requiere exactamente 5 jugadores.", type: "danger" };
          return;
        }

        const roles = ["liberal", "liberal", "liberal", "fascista", "hitler"];
        const shuffledRoles = roles.sort(() => Math.random() - 0.5);

        const batch = writeBatch(db); // Initialize Firestore batch
        for (let i = 0; i < players.value.length; i++) {
          const player = players.value[i];
          const role = shuffledRoles[i];
          const playerDocRef = doc(db, "partidas", props.codigoSala, "jugadores", player.id);

          batch.update(playerDocRef, { rol: role }); // Add update to batch
          players.value[i] = { ...player, rol: role }; // Update local state
        }

        await batch.commit(); // Commit all updates in a single operation
        console.log("Roles asignados:", players.value);
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
        // Verificar si los roles ya están asignados
        const rolesAsignados = players.value.every((player) => player.rol);
        if (!rolesAsignados) {
          console.log("Asignando roles...");
          await assignRoles(); // Asignar roles a los jugadores
        } else {
          console.log("Roles ya asignados, no se reasignan.");
        }

        console.log("Seleccionando presidente...");
        await selectRandomPresident(); // Seleccionar al presidente
      } catch (error) {
        console.error("Error al iniciar la partida:", error);
        notification.value = { message: "Error al iniciar la partida", type: "danger" };
      }
    };

    if (electionTracker < 0 || electionTracker > 3) {
      console.error("Valor inválido para electionTracker:", electionTracker);
    }
    if (fascistProgress < 0 || fascistProgress > 6) {
      console.error("Valor inválido para fascistProgress:", fascistProgress);
    }

    console.log('fascistProgress:', fascistProgress.value);
    console.log('electionTracker:', electionTracker.value);

    watch(players, (newVal) => {
      console.log("Lista de jugadores actualizada:", newVal);
    });

    return {
      notification,
      players,
      showChancellorSelector,
      fascistProgress,
      liberalProgress,
      electionTracker,
      isGameOver,
      politicas,
      drawnPolicies,
      showPolicyModal,
      politicasParaCanciller,
      currentPresident, 
      currentChancellor, 
      numPlayers,
      showFascistPower,
      currentUser,
      handleFascistEffect,
      drawPolicies,
      enactPolicy,
      resetGame,
      handleChancellorSelected,
      handlePresidentPolicySelection,
      handleChancellorPolicySelection,
      selectRandomPresident,
      finalizarPresidencia
    };
  },
};
</script>

<style scoped>
.game-container {
  max-width: 1400px;
  margin: 0 auto;
}

.policy-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
}

.policy-card {
  min-width: 100px;
  font-weight: bold;
}

.game-over {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
}

.alert {
  margin: 0 auto 1rem;
  max-width: 80%;
}

.players-container {
  width: 100%;
  overflow-x: auto;
  padding: 1rem;
  margin-bottom: 2rem;
}

.player-card {
  min-width: 120px;
  padding: 0.5rem;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.decks-container {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
}

.player-image {
  width: 60px; /* Reduce el tamaño de la imagen */
  height: 60px; /* Reduce el tamaño de la imagen */
  border-radius: 50%; /* Hace que la imagen sea circular */
  object-fit: cover; /* Ajusta la imagen para que no se deforme */
  margin-bottom: 0.5rem;
}

.player-name {
  font-size: 0.8rem; /* Reduce el tamaño del texto */
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.player-role {
  font-size: 0.7rem; /* Reduce el tamaño del texto */
  color: #666;
}

.chancellor-selector {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.player-option {
  width: 100%;
}

.player-option button {
  width: 100%;
  padding: 0.5rem;
  text-align: left;
  transition: all 0.3s ease;
}

.player-option button:hover {
  background-color: #e9ecef;
  transform: translateX(5px);
}
</style>
