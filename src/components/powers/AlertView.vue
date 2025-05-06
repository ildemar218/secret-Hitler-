<template>
    <div>
      <h3>{{ message }}</h3>
      <PlayerContainer :player="targetPlayer" />
      <ConfirmButton @click="$emit('confirm')" />
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
  