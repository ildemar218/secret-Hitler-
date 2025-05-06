<template>
    <div>
      <h3>Selecciona una carta para promulgar o vetar</h3>
      <div class="card-options">
        <button @click="$emit('confirm', 'fascist')">Fascista</button>
        <button @click="$emit('confirm', 'liberal')">Liberal</button>
      </div>
      <div class="actions">
        <VetoButton @click="$emit('confirm', 'veto')" />
        <ConfirmButton @click="$emit('confirm', 'veto')" />
      </div>
    </div>
</template>
  
<script setup>
  import VetoButton from '../VetoButton.vue'
  import ConfirmButton from '../ConfirmButton.vue'
</script>
  