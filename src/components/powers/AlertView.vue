<template>
    <div>
      <h3 class="title">{{ message }}</h3>
      <div class="targetplayer-container">
        <PlayerContainer :player="targetPlayer" /> 
      </div>
      <div class="btn-container">
        <ConfirmButton @click="$emit('confirm')" />
      </div>
    </div>
</template>
  
<script setup>
  import PlayerContainer from '../PlayerContainer.vue'
  import ConfirmButton from '../ConfirmButton.vue'
  
  const props = defineProps({
    message: String,
    targetPlayer: Object,
  })
</script>

<style scoped>
.title {
  display: flex;
  justify-content: center;
}

.targetplayer-container {
  display: flex;
  justify-content: center;
  margin: 10px;
  padding: 10px;
}

.btn-container {
  display: flex;
  justify-content: center;
}
</style>
  