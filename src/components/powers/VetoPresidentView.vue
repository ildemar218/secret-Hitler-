<template>
    <div>
      <h3>El canciller decidió realizar veto</h3>
      <div class="actions">
        <AcceptButton @click="$emit('confirm', 'accept')" />
        <DenyButton @click="$emit('confirm', 'deny')" />
      </div>
    </div>
</template>
  
<script setup>
  import AcceptButton from '../AcceptButton.vue'
  import DenyButton from '../DenyButton.vue'
</script>
  