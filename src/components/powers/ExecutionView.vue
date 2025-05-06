<template>
    <div>
      <h3>Selecciona el jugador a ejecutar</h3>
      <div class="player-list">
        <PlayerContainer
          v-for="player in players"
          :key="player.id"
          :player="player"
          :selected="selectedPlayer?.id === player.id"
          @click="$emit('select', player)"
        />
      </div>
      <ConfirmButton @click="$emit('confirm', selectedPlayer)" />
    </div>
</template>
  
<script setup>
  import PlayerContainer from '../PlayerContainer.vue'
  import ConfirmButton from '../ConfirmButton.vue'
  
  const props = defineProps({
    players: Array,
    selectedPlayer: Object,
  })
</script>
  