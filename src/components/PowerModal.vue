<template>
    <div class="power-modal">
        <BaseModal v-if="visible" @close="close">
          <component
            :is="currentViewComponent"
            :players="players"
            :selectedPlayer="selectedPlayer"
            :president="president"
            :chancellor="chancellor"
            :currentPlayer="currentPlayer"
            @confirm="handleConfirm"
            @select="handleSelect"
          />
        </BaseModal>
    </div>
</template>
  
<script setup>
  import { computed } from 'vue'
  
  import ExecutionView from './powers/ExecutionView.vue'
  import IdentityView from './powers/IdentityView.vue'
  import NextPresidentView from './powers/NextPresidentView.vue'
  import VetoChancellorView from './powers/VetoChancellorView.vue'
  import VetoPresidentView from './powers/VetoPresidentView.vue'
  import AlertView from './powers/AlertView.vue'
  
  const props = defineProps({
    visible: Boolean,
    power: String, // 'execution', 'identity', 'next-president', 'veto-chancellor', 'veto-president', 'alert'
    players: Array,
    selectedPlayer: Object,
    president: Object,
    chancellor: Object,
    currentPlayer: Object,
  })
  
  const emit = defineEmits(['close', 'confirm', 'select'])
  
  const close = () => emit('close')
  const handleConfirm = (payload) => emit('confirm', payload)
  const handleSelect = (player) => emit('select', player)
  
  const currentViewComponent = computed(() => {
    switch (props.power) {
      case 'execution':
        return ExecutionView
      case 'identity':
        return IdentityView
      case 'next-president':
        return NextPresidentView
      case 'veto-chancellor':
        return VetoChancellorView
      case 'veto-president':
        return VetoPresidentView
      case 'alert':
      default:
        return AlertView
    }
  })
</script>

<style scoped>
.power-modal{
    background-color: white;
    padding: 2em;
    border: 2px solid black;
}
</style>