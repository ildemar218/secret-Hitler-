<template>
  <div class="container-creategame">
    <div class="card-creategame p-4">
      <h2 class="text-center mb-3">Código: {{ codigo }}</h2>
      <p class="text-center mb-3">
        Estado de la partida:
        <span class="badge bg-primary">{{ estado === "iniciada" ? "Iniciada" : "No iniciada" }}</span>
      </p>

      <h4 class="text-center mb-4">Lista de participantes</h4>

      <!-- Lista de jugadores -->
      <div class="list-group mb-4">
        <div
          v-for="(jugador, index) in participantes"
          :key="index"
          class="list-group-item"
        >
          {{ jugador.nombreEnJuego }}
        </div>
      </div>

      <!-- Botón para iniciar partida -->
      <button class="btn btn-primary w-100 mb-3" @click="iniciarPartida">Iniciar partida</button>

      <!-- Botón para unirse a una partida -->
      <router-link to="/join-game">
        <button class="btn btn-success w-100 mb-3">Unirse a una partida</button>
      </router-link>

      <!-- Botón para volver -->
      <router-link to="/">
        <button class="btn btn-danger w-100">Volver</button>
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from '../firebase/auth.js';
import { createGame, startGame, onGameStateChange, onPlayersChange } from "../firebase/servicesFirebase.js";
import Swal from "sweetalert2";

export default {
  setup() {
    const codigo = ref("");
    const participantes = ref([]);
    const estado = ref("esperando");
    const router = useRouter();
    let unsubscribeGame = null;
    let unsubscribePlayers = null;

    onMounted(async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        Swal.fire("Error", "Debes iniciar sesión para crear una partida.", "error");
        return;
      }

      try {
        // Crear nueva partida
        const gameCode = await createGame(user);
        codigo.value = gameCode;

        // Escuchar cambios en los jugadores
        unsubscribePlayers = onPlayersChange(gameCode, (players) => {
          participantes.value = players;
        });

        // Escuchar cambios en el estado de la partida
        unsubscribeGame = onGameStateChange(gameCode, (gameData) => {
          estado.value = gameData.estado;
          if (gameData.estado === "iniciada") {
            router.push(`/gameboard/${gameCode}`);
          }
        });

      } catch (error) {
        console.error("Error al crear la partida:", error);
        Swal.fire("Error", "No se pudo crear la partida. Inténtalo de nuevo.", "error");
      }
    });

    const iniciarPartida = async () => {
      try {
        if (participantes.value.length < 5) {
          Swal.fire("Error", "Se necesitan al menos 5 jugadores para iniciar la partida.", "error");
          return;
        }

        // Asegurarse de que todos los jugadores tengan los campos necesarios
        const jugadoresPreparados = participantes.value.map(jugador => ({
          idJugador: jugador.idJugador,
          nombreEnJuego: jugador.nombreEnJuego,
          esHost: jugador.esHost || false
        }));

        await startGame(codigo.value, jugadoresPreparados[0].idJugador, jugadoresPreparados);
        Swal.fire("¡Partida iniciada!", "La partida ha comenzado correctamente.", "success");
      } catch (error) {
        console.error("Error al iniciar la partida:", error);
        Swal.fire("Error", "No se pudo iniciar la partida.", "error");
      }
    };

    onUnmounted(() => {
      if (unsubscribeGame) unsubscribeGame();
      if (unsubscribePlayers) unsubscribePlayers();
    });

    return { codigo, participantes, estado, iniciarPartida };
  },
};
</script>

<style scoped>
.container-creategame {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('/fondo.jpg'); /* mismo fondo de cartas UNO */
  background-size: cover;
  background-position: center;
}

.card-creategame {
  background: rgba(255, 255, 255); /* blanco con 90% opacidad */
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 400px;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}
</style>