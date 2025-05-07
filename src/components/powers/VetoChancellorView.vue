<template>
    <div>
      <h3 class="title">Selecciona una carta para promulgar o vetar</h3>
      <div class="card-options">
        <button class="card fascist" @click="$emit('confirm', 'fascist')">Fascista</button>
        <button class="card liberal" @click="$emit('confirm', 'liberal')">Liberal</button>
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

<style scoped>
.title {
  display: flex;
  justify-content: center;
}

.card-options{
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.card{
  padding: 5rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: trasform 0.2s ease;
}

.card:hover {
  transform: scale(1.05);
}

.fascist {
  background-color: red;
  color: white;
}

.liberal {
  background-color: blue;
  color: white;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}
</style>