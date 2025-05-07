<template>
    <div>
      <h3 class="title">Selecciona el jugador a ejecutar</h3>
      <div class="player-list">
        <PlayerContainer
          v-for="player in players"
          :key="player.id"
          :player="player"
          :imagen="player.imagen"
          :nombre="player.nombre"
          :selected="selectedPlayer?.id === player.id"
          @click="$emit('select', player)"
        />
      </div>
      <div class="btn-container">
        <ConfirmButton @click="$emit('confirm', selectedPlayer)" />
      </div>
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

<style scoped>
.player-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 10px;
  padding: 10px;
}

.btn-container {
  display: flex;
  justify-content: center;
}

.title {
  display: flex;
  justify-content: center;
}
</style>