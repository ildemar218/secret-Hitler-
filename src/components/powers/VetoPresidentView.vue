<template>
    <div>
      <h3 class="title">El canciller decidió realizar veto</h3>
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

<style scoped>
.title {
  display: flex;
  justify-content: center;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 2em;
}
</style>