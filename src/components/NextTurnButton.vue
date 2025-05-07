<template>
  <button 
    class="btn btn-warning"
    @click="handleNextTurn"
    :disabled="!canChangeTurn"
  >
    Terminar presidencia
  </button>
</template>

<script>
import { ref, computed } from 'vue';
import { updateDocument } from '../firebase/servicesFirebase';

export default {
  name: 'NextTurnButton',
  props: {
    codigoSala: {
      type: String,
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    currentPresident: {
      type: Object,
      required: true
    }
  },
  emits: ['turn-changed'],
  setup(props, { emit }) {
    const canChangeTurn = computed(() => {
      return props.players.length > 0 && props.currentPresident;
    });

    const handleNextTurn = async () => {
      try {
        // Ordenar jugadores por ordenTurno
        const sortedPlayers = [...props.players].sort((a, b) => a.ordenTurno - b.ordenTurno);
        const totalJugadores = sortedPlayers.length;
        
        // Obtener el turno del presidente actual
        const currentTurno = props.currentPresident.ordenTurno;
        
        // Calcular el próximo turno
        let nextTurno = currentTurno + 1;
        if (nextTurno > totalJugadores) {
          nextTurno = 1;
        }
        
        // Buscar al siguiente presidente
        const nextPresident = sortedPlayers.find(p => p.ordenTurno === nextTurno);
        
        if (!nextPresident) {
          console.error("No se pudo encontrar el siguiente presidente");
          return;
        }

        // Actualizar en Firebase
        await updateDocument("partidas", props.codigoSala, {
          id_presidente: nextPresident.id,
          turnoActual: nextTurno
        });

        // Emitir evento con el nuevo presidente
        emit('turn-changed', nextPresident);
      } catch (error) {
        console.error("Error al cambiar el turno:", error);
      }
    };

    return {
      canChangeTurn,
      handleNextTurn
    };
  }
};
</script>

<style scoped>
.btn {
  margin: 10px;
  padding: 10px 20px;
  font-weight: bold;
}
</style> 