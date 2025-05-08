<template>
  <div
    v-if="message"
    :class="[
      'alert',
      type === 'success' ? 'alert-success' : 
      type === 'danger' ? 'alert-danger' : 
      type === 'info' ? 'alert-info' : 'alert-warning'
    ]"
  >
    {{ message }}
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'danger', 'info', 'warning'].includes(value)
  }
})
</script>

<style scoped>
.alert {
  margin: 0 auto 1rem;
  max-width: 80%;
}
</style> 