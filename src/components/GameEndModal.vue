<!-- components/modals/GameEndModal.vue -->
<template>
    <div class="endgame-modal">
      <h2 class="winner">{{ winnerMessage }}</h2>
      <p class="reason">{{ victoryReason }}</p>

      <div class="players-list">
        <PlayerContainer 
        v-for="player in players"
        :key="player.id"
        :nombre="player.nombre"
        :imagen="player.imagen"
        :rol="player.rol"
        />
      </div>
      <ConfirmButton @click="$emit('confirm')" />
    </div>
</template>
  
<script setup>
  import { computed } from 'vue'  
  import ConfirmButton from './ConfirmButton.vue'
  import PlayerContainer from './PlayerContainer.vue'

  const props = defineProps({
    winner: String, // 'fascist' o 'liberal'
    condition: String, // condición de victoria
    players: Array,
  })
  
  const winnerMessage = computed(() => {
    return props.winner === 'fascist' ? '¡Los fascistas han ganado!' : '¡Los liberales han ganado!'
  })
  
  const victoryReason = computed(() => {
    switch (props.condition) {
      case 'hitler-elected':
        return 'Hitler fue elegido canciller con 3 políticas fascistas promulgadas.'
      case 'fascist-policies':
        return 'Se promulgaron 6 políticas fascistas.'
      case 'hitler-killed':
        return 'Hitler fue ejecutado.'
      case 'liberal-policies':
        return 'Se promulgaron 5 políticas liberales.'
      default:
        return 'Condición de victoria desconocida.'
    }
  })
</script>
  
<style scoped>
  .endgame-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background-color: white;
    border: 2px solid black;
    border-radius: 12px;
    text-align: center;
  }
  
  .winner {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }
  
  .reason {
    font-size: 1rem;
    color: #666;
  }

  .players-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0;
  }
</style>
  