<template>
    <div class="confirm-policy">
      <h3 class="message">La política promulgada es:</h3>
      <div class="policy" :class="policy">
        {{ policy === 'fascist' ? 'Fascista' : 'Liberal' }}
      </div>
      <div class="btn-container">
        <ConfirmButton @click="$emit('confirm')" />
      </div>
    </div>
</template>
  
<script setup>
  import ConfirmButton from './ConfirmButton.vue'
  
  const props = defineProps({
    policy: {
      type: String,
      required: true, // 'fascist' o 'liberal'
    },
  })
</script>
  
<style scoped>
  .confirm-policy{
    background-color: white;
    padding: 2em;
    border: 2px solid black;
    border-radius: 8px;
    align-items: center;
    display: flex;
    flex-direction: column;
  }

  .message {
    text-align: center;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .policy {
    padding: 90px 45px;
    max-width: 150px;
    margin-top: 5px;
    margin-bottom: 20px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 8px;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .policy.fascist {
    background-color: #ff4d4d;
    color: white;
  }
  .policy.liberal {
    background-color: #4d79ff;
    color: white;
  }

  .btn-container {
    display: flex;
    justify-content: center;
  }
</style>
  