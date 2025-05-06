<template>
  <div
    class="container-fluid text-center mt-4 game-container"
    style="max-width: 1400px; margin: 0 auto"
  >
    <!-- Área de notificaciones -->
    <div
      v-if="notification.message"
      :class="[
        'alert',
        notification.type === 'success' ? 'alert-success' : 'alert-danger',
      ]"
    >
      {{ notification.message }}
    </div>

    <!-- Contenedor de Jugadores -->
    <div class="players-container mb-4">
      <div v-if="players.length > 0">
        <PlayerContainer
          v-for="player in players"
          :key="player.id"
          :nombre="player.nombre"
          :rol="
            player.id === currentPresident?.id
              ? 'Presidente'
              : player.id === currentChancellor?.id
              ? 'Canciller'
              : player.rol
          "
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
        <DecksEndTermButton class="mx-3" />
      </div>
    </div>

    <!-- Selector de Canciller -->
    <PresidentCansillerSelector
      v-if="
        showChancellorSelector &&
        currentPresident &&
        currentPresident.id === currentUser?.id
      "
      :players="players"
      :presidentId="currentPresident?.id"
      @chancellor-selected="handleChancellorSelected"
    >
      <template v-slot:default="{ players, presidentId }">
        <div>
          <h3>Selecciona un Canciller</h3>
          <ul>
            <li
              v-for="player in players.filter((p) => p.id !== presidentId)"
              :key="player.id"
            >
              <button @click="$emit('chancellor-selected', player)">
                {{ player.nombre }}
              </button>
            </li>
          </ul>
        </div>
      </template>
    </PresidentCansillerSelector>

    <LiberalBoard />
    <FascistBoard playerCount="9" />

    <!-- Tablero Liberal -->
    <!-- <div class="mb-4">
      <div class="d-flex justify-content-center">
        <LiberalCard
          :passedPolicies="liberalProgress"
          :trackerPosition="electionTracker"
        />
      </div>
    </div> -->

    <!-- Tablero Fascista -->
    <!-- <div class="mb-4">
      <div class="d-flex justify-content-center">
        <FascistCard
          v-if="
            fascistProgress >= 0 &&
            fascistProgress <= 6 &&
            electionTracker >= 0 &&
            electionTracker <= 3
          "
          :passedPolicies="fascistProgress"
          :trackerPosition="electionTracker"
          :currentPlayerCount="numPlayers"
          @policy-effect="handleFascistEffect"
        />
      </div>
      <div v-if="showFascistPower" class="mt-3">
        <h5>¡Poder Fascista Activado!</h5>
        <p>{{ fascistPowerDescription }}</p>
        <button
          v-if="currentPower === 'investigate'"
          class="btn btn-warning me-2"
          @click="showPlayerInvestigation"
        >
          Investigar Jugador
        </button>
        <button
          v-if="currentPower === 'policyPeek'"
          class="btn btn-warning me-2"
          @click="showPolicyPeek"
        >
          Ver Próximas Políticas
        </button>
      </div>
    </div> -->

    <!-- Controles del Juego -->
    <div class="game-controls mt-4">
      <div class="mb-3">
        <h4>Acciones Disponibles</h4>
        <button
          class="btn btn-primary me-2"
          @click="drawPolicies"
          :disabled="isGameOver || politicas.length < 3"
        >
          Robar Políticas ({{ politicas.length }} restantes)
        </button>
        <button
          v-if="drawnPolicies.length > 0"
          class="btn btn-success me-2"
          @click="showPolicySelection"
        >
          Seleccionar Política a Promulgar
        </button>
      </div>

      <!-- Selección de Política (modal) -->
      <div v-if="showPolicyModal" class="policy-modal">
        <div class="modal-content">
          <h4>Selecciona una política para promulgar</h4>
          <div class="d-flex justify-content-center my-3">
            <button
              v-for="(policy, index) in drawnPolicies"
              :key="index"
              class="btn policy-card mx-2"
              :class="
                policy.tipo_carta === 'fascista' ? 'btn-danger' : 'btn-primary'
              "
              @click="handlePresidentPolicySelection(policy.tipo_carta)"
            >
              {{ policy.tipo_carta === "fascista" ? "Fascista" : "Liberal" }}
            </button>
          </div>
          <button class="btn btn-secondary" @click="showPolicyModal = false">
            Cancelar
          </button>
        </div>
      </div>

      <!-- Selección de Política por Canciller -->
      <div v-if="politicasParaCanciller.length > 0" class="policy-modal">
        <div class="modal-content">
          <h4>Selecciona una política para promulgar</h4>
          <div class="d-flex justify-content-center my-3">
            <button
              v-for="(policy, index) in politicasParaCanciller"
              :key="index"
              class="btn policy-card mx-2"
              :class="
                policy.tipo_carta === 'fascista' ? 'btn-danger' : 'btn-primary'
              "
              @click="handleChancellorPolicySelection(policy.tipo_carta)"
            >
              {{ policy.tipo_carta === "fascista" ? "Fascista" : "Liberal" }}
            </button>
          </div>
        </div>
      </div>
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
      <button class="btn btn-info mt-3" @click="resetGame">
        Nueva Partida
      </button>
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
import {
  onSnapshotSubcollection,
  updateDocument,
  createSubCollection,
  enrichDataWithField,
  readSubcollection,
  readDocumentById,
  onSnapshotDocument,
  updateSubcollectionDocument,
} from "../firebase/servicesFirebase"; // Importación de función para escuchar cambios
import { AuthService } from "../firebase/auth.js";
import { writeBatch, doc } from "firebase/firestore";
import FascistBoard from "../components/FascistBoard.vue";
import LiberalBoard from "../components/LiberalBoard.vue";

export default {
  props: ["codigoSala"],
  components: {
    PlayerContainer,
    DecksEndTermButton,
    PresidentCansillerSelector,
    FascistCard,
    LiberalCard,
    FascistBoard,
    LiberalBoard,
  },
  setup(props) {
    const notification = ref({ message: "", type: "" });
    // const players = ref([]); // Lista de jugadores
    const showChancellorSelector = ref(false);
    const fascistProgress = ref(0);
    const liberalProgress = ref(0);
    const electionTracker = ref(1); // Cambiar el valor inicial a 1
    const isGameOver = ref(false);
    const drawnPolicies = ref([]);
    const showPolicyModal = ref(false);
    const politicasParaCanciller = ref([]);
    // const currentPresident = ref({ id: null, nombre: null });
    // const currentChancellor = ref(null);
    const numPlayers = computed(() => players.value.length); // Número de jugadores
    const showFascistPower = ref(false); // Mostrar poderes fascistas
    const currentUser = ref(null);
    const gameStarted = ref(false); // Bandera para evitar múltiples inicios

    const players = ref([
      {
        id: 1,
        nombre: "Juan Pérez",
        rol: "Liberal",
        imagen: "https://via.placeholder.com/100",
      },
      {
        id: 2,
        nombre: "María Gómez",
        rol: "Fascista",
        imagen: "https://via.placeholder.com/100",
      },
      {
        id: 3,
        nombre: "Luis Ramírez",
        rol: "Hitler",
        imagen: "https://via.placeholder.com/100",
      },
      {
        id: 4,
        nombre: "Ana Torres",
        rol: "Liberal",
        imagen: "https://via.placeholder.com/100",
      },
      {
        id: 5,
        nombre: "Carlos Díaz",
        rol: "Fascista",
        imagen: "https://via.placeholder.com/100",
      },
    ]);

    const currentPresident = ref(players.value[1]); // María Gómez
    const currentChancellor = ref(players.value[4]); // Carlos Díaz

    // Escuchar jugadores en tiempo real y sincronizar estado local con Firebase
    onMounted(async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          currentUser.value = { id: user.uid, name: user.displayName };
        }

        const unsubscribePlayers = onSnapshotSubcollection(
          "partidas",
          props.codigoSala,
          "jugadores",
          (jugadores) => {
            const updatedPlayers = jugadores.map((jugador) => ({
              id: jugador.id,
              nombre: jugador.nombre,
              rol: jugador.rol,
              esta_vivo: jugador.esta_vivo,
              conectado: jugador.conectado,
              imagen: jugador.imagen || "/public/image.png", // Imagen por defecto si no tiene una
            }));

            players.value = updatedPlayers;
            console.log(
              "Jugadores actualizados desde la base de datos:",
              players.value
            );
          }
        );

        const unsubscribeGame = onSnapshotDocument(
          "partidas",
          props.codigoSala,
          (partida) => {
            console.log("Datos de la partida:", partida);
            if (partida) {
              fascistProgress.value = partida.fascistProgress || 0;
              electionTracker.value = partida.electionTracker || 0;

              if (partida.id_presidente) {
                const president = players.value.find(
                  (player) => player.id === partida.id_presidente
                );
                currentPresident.value = president || {
                  id: null,
                  nombre: null,
                }; // Valor por defecto si no se encuentra
              }

              if (partida.id_canciller) {
                const chancellor = players.value.find(
                  (player) => player.id === partida.id_canciller
                );
                currentChancellor.value = chancellor || null; // Valor por defecto si no se encuentra
              }

              // Iniciar la partida si está en estado "iniciada" y no se ha iniciado previamente
              if (
                players.value.length >= 5 &&
                partida.estado === "iniciada" &&
                !gameStarted.value
              ) {
                console.log("Iniciando la partida...");
                gameStarted.value = true; // Marcar como iniciado
                startGame();
              }
            }
          }
        );

        return () => {
          unsubscribePlayers();
          unsubscribeGame();
        };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
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
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
          notification.value = {
            message: "¡Los Fascistas han ganado!",
            type: "danger",
          };
        } else if (liberalProgress.value >= 5) {
          isGameOver.value = true;
          await updateDocument("partidas", props.codigoSala, {
            estado: "finalizada",
            ganador: "liberales",
          });
          notification.value = {
            message: "¡Los Liberales han ganado!",
            type: "success",
          };
        }
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
        notification.value = {
          message: "La partida ha sido reiniciada.",
          type: "info",
        };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
        notification.value = {
          message: `¡${chancellor.nombre} ha sido nominado como Canciller!`,
          type: "info",
        };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const handlePresidentPolicySelection = async (selectedPolicy) => {
      try {
        const remainingPolicies = drawnPolicies.value.filter(
          (policy) => policy.tipo_carta !== selectedPolicy
        );

        await updateDocument("partidas", props.codigoSala, {
          politicas_para_canciller: remainingPolicies,
        });

        politicasParaCanciller.value = remainingPolicies;
        notification.value = {
          message: "El Canciller debe seleccionar una política.",
          type: "info",
        };
        showPolicyModal.value = false;
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
        notification.value = {
          message: `¡Se ha promulgado una política ${selectedPolicy}!`,
          type: "success",
        };
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const selectRandomPresident = async () => {
      try {
        const randomIndex = Math.floor(Math.random() * players.value.length);
        const selectedPresident = players.value[randomIndex];

        if (!selectedPresident) {
          console.error("No se pudo seleccionar un presidente.");
          return;
        }

        currentPresident.value = selectedPresident;

        players.value = players.value.map((player) =>
          player.id === selectedPresident.id
            ? { ...player, rol: "presidente" }
            : player
        );

        await updateDocument("partidas", props.codigoSala, {
          id_presidente: selectedPresident.id,
        });

        console.log("Presidente seleccionado:", selectedPresident);

        notification.value = {
          message: `¡${selectedPresident.nombre} es el Presidente!`,
          type: "info",
        };
        showChancellorSelector.value = true;
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
                notification.value = {
                  message: "¡El Canciller ha sido aprobado!",
                  type: "success",
                };
                startPolicySelection(); // Iniciar la selección de políticas
              } else {
                notification.value = {
                  message: "El Canciller ha sido rechazado.",
                  type: "danger",
                };
                resetTurn(); // Reiniciar el turno
              }
            }
          }
        );

        return () => unsubscribe(); // Cancelar la suscripción al desmontar
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
        await createSubCollection(
          "partidas",
          props.codigoSala,
          "turnos",
          turnoData
        );
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
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
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const assignRoles = async () => {
      try {
        if (players.value.length !== 5) {
          notification.value = {
            message: "La partida requiere exactamente 5 jugadores.",
            type: "danger",
          };
          return;
        }

        const roles = ["liberal", "liberal", "liberal", "fascista", "hitler"];
        const shuffledRoles = roles.sort(() => Math.random() - 0.5);

        const batch = writeBatch(db); // Initialize Firestore batch
        for (let i = 0; i < players.value.length; i++) {
          const player = players.value[i];
          const role = shuffledRoles[i];
          const playerDocRef = doc(
            db,
            "partidas",
            props.codigoSala,
            "jugadores",
            player.id
          );

          batch.update(playerDocRef, { rol: role }); // Add update to batch
          players.value[i] = { ...player, rol: role }; // Update local state
        }

        await batch.commit(); // Commit all updates in a single operation
        console.log("Roles asignados:", players.value);
      } catch (error) {
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
      }
    };

    const startGame = async () => {
      try {
        if (players.value.length !== 5) {
          notification.value = {
            message: "La partida requiere exactamente 5 jugadores.",
            type: "danger",
          };
          return;
        }

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
        if (error.code === "resource-exhausted") {
          notification.value = {
            message:
              "Se ha excedido el límite de Firestore. Inténtalo más tarde.",
            type: "danger",
          };
        } else {
          console.error("Error:", error);
        }
      }
    };

    if (electionTracker < 0 || electionTracker > 3) {
      console.error("Valor inválido para electionTracker:", electionTracker);
    }
    if (fascistProgress < 0 || fascistProgress > 6) {
      console.error("Valor inválido para fascistProgress:", fascistProgress);
    }

    console.log("fascistProgress:", fascistProgress.value);
    console.log("electionTracker:", electionTracker.value);

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
    };
  },
};
</script>

<style scoped>
.game-container {
  max-width: 1400px; /* Ya está configurado en el template */
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
  display: flex;
  flex-wrap: wrap; /* Permite que los elementos se ajusten a la siguiente fila si no caben */
  justify-content: center; /* Centra los jugadores horizontalmente */
  gap: 0.5rem; /* Espaciado entre las tarjetas */
}

.decks-container {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
}

.player-card {
  width: 100px; /* Reduce el ancho de las tarjetas */
  padding: 0.5rem; /* Reduce el relleno interno */
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
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
</style>
