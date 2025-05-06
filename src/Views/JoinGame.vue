<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100">
    <div class="card card-join">
      <div class="p-4 shadow-sm rounded-3 bg-white">
        <h1 class="text-center mb-4"><i class="bi bi-joystick icon"></i></h1>
        <h1 class="text-center mb-4 fw-bold">Unirse a una partida</h1>
        <input
          type="text"
          class="form-control my-2"
          placeholder="Ingrese el código de la partida"
          v-model="codigoIngresado"
          :disabled="esperandoInicio"
        />

        <div class="d-grid">
          <button class="btn btn-success" @click="unirseAPartida" :disabled="esperandoInicio">
            {{ esperandoInicio ? "Esperando..." : "Unirse" }}
          </button>
          <button class="btn btn-danger mt-2" @click="$router.push('/login')">
            Cancelar
          </button>
        </div>

        <div v-if="esperandoInicio" class="mt-3 text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Esperando...</span>
          </div>
        </div>

        <p v-if="mensaje" class="mt-2 text-center">{{ mensaje }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from '../firebase/auth.js';
import { readDocumentById, queryDocuments, createSubCollection, onSnapshotDocument, readSubcollection } from "../firebase/servicesFirebase.js"
import Swal from "sweetalert2";
import { serverTimestamp } from "firebase/firestore";

export default {
  setup() {
    const codigoIngresado = ref("");
    const mensaje = ref("");
    const esperandoInicio = ref(false);
    const partidaIniciada = ref(false);
    const jugadores = ref([]);
    const saldo = ref(1500);

    const router = useRouter();

    let unsubscribeDocumento = null;

    const unirseAPartida = async () => {
      try {
        const codigoClean = codigoIngresado.value.trim().toUpperCase();

        if (!codigoClean) {
          Swal.fire("Error", "Debes ingresar un código de partida.", "error");
          return;
        }


        // Verifica si la partida existe con el código
        const partidaSnap = await readDocumentById("partidas", codigoClean);

        if (!partidaSnap) {
          Swal.fire("Error", "El código de la partida no existe.", "error");
          return;
        }

        const user = await AuthService.getCurrentUser();
        if (!user) {
          Swal.fire("Error", "Debes iniciar sesión para unirte a una partida.", "error");
          return;
        }

        const { displayName, uid } = user;
        const jugadorActual = displayName || "Jugador";
        // Trae los jugadores de la partida
        const jugadoresSnap = await readSubcollection("partidas", partidaSnap.id, "jugadores_partida");
        console.log("jugadores", jugadoresSnap);

        // Verifica si el jugador ya está registrado en la partida
        const isInGame = jugadoresSnap.some((jugador) => jugador.idJugador === uid);
        console.log("¿Jugador ya está en la partida?", isInGame);
        
        if (isInGame) {
          if (partidaSnap.estado === "iniciada") {
            Swal.fire("Bienvenido de vuelta", "Ya estás registrado en esta partida.", "info");
            router.push("/gameboard/" + partidaSnap.id);
          } else {
            Swal.fire("Bienvenido de vuelta", "Ya estás registrado en esta partida, pero aún no ha empezado la partida.", "info");
            mensaje.value = "Esperando que el anfitrión inicie...";
            esperandoInicio.value = true;
          }
          return;
        }

        // Valida si la partida ya está iniciada
        if (partidaSnap.estado === "iniciada") {
          Swal.fire("Partida en curso", "La partida ya ha comenzado. No puedes unirte en este momento.", "warning");
          return;
        }

        // Valida si la partida ya está llena
        if (jugadoresSnap.length >= 10) {
          Swal.fire("Sala llena", "La sala ha alcanzado su capacidad máxima de jugadores.", "error");
          return;
        }

        // Añade al jugador como un documento en la subcolección "jugadores_partida"
        await createSubCollection("partidas", codigoClean, "jugadores_partida", {
          idJugador: uid,
          idPartida: partidaSnap.id,
          nombreEnJuego: jugadorActual,
          host: false,
          estadoUno: false,
          fecha_union: serverTimestamp()
        });

        esperandoInicio.value = true;
        Swal.fire({
          title: "Nuevo jugador en la sala",
          icon: "success",
          text: `¡Bienvenido a la sala ${partidaSnap.id}! ${jugadorActual} se ha unido al juego.`,
        });

        mensaje.value = "Te has unido a la partida. Esperando que el anfitrión inicie...";

        // Escuchar cambios en la partida
        unsubscribeDocumento = await onSnapshotDocument("partidas",partidaSnap.id, (docSnap) => {
          if (docSnap) {
            if (docSnap.estado === "iniciada") {
              partidaIniciada.value = true;
              esperandoInicio.value = false;
            }
          }
        });

      } catch (error) {
        console.error("Error al unirse a la partida:", error);
        Swal.fire("Error", "No se pudo unir a la partida.", "error");
      }
    };

    // Redirigir cuando la partida se inicie
    watchEffect(() => {
      let codigoClean = codigoIngresado.value.trim().toUpperCase();
      if (partidaIniciada.value) {
        router.push("/gameboard/" + codigoClean);
      }
    });

    onUnmounted(() => {
      if (unsubscribeDocumento) {
        unsubscribeDocumento();
      }
    });

    return {
      codigoIngresado,
      mensaje,
      esperandoInicio,
      partidaIniciada,
      jugadores,
      saldo,
      unirseAPartida,
    };
  },
};
</script>

<style scoped>
.icon{
  font-size: 5rem;
}
</style>