<template>
  <div class="policy-area">
    <!-- Controles del Juego -->
    <div class="game-controls mt-4">
      <div class="mb-3">
        <h4>Acciones Disponibles</h4>
        <button
          class="btn btn-primary me-2"
          @click="drawPolicies"
          :disabled="isGameOver || politicas.length < 3"
        >
          Robar Políticas ({{ politicas.length }} restantes)
        </button>
        <button
          v-if="drawnPolicies.length > 0"
          class="btn btn-success me-2"
          @click="showPolicySelection"
        >
          Seleccionar Política a Promulgar
        </button>
      </div>

      <!-- Selección de Política (modal) -->
      <div v-if="showPolicyModal" class="policy-modal">
        <div class="modal-content">
          <h4>Selecciona una política para promulgar</h4>
          <div class="d-flex justify-content-center my-3">
            <button
              v-for="(policy, index) in drawnPolicies"
              :key="index"
              class="btn policy-card mx-2"
              :class="policy.tipo_carta === 'fascista' ? 'btn-danger' : 'btn-primary'"
              @click="handlePresidentPolicySelection(policy.tipo_carta)"
            >
              {{ policy.tipo_carta === "fascista" ? "Fascista" : "Liberal" }}
            </button>
          </div>
          <button class="btn btn-secondary" @click="showPolicyModal = false">
            Cancelar
          </button>
        </div>
      </div>

      <!-- Selección de Política por Canciller -->
      <div v-if="politicasParaCanciller.length > 0" class="policy-modal">
        <div class="modal-content">
          <h4>Selecciona una política para promulgar</h4>
          <div class="d-flex justify-content-center my-3">
            <button
              v-for="(policy, index) in politicasParaCanciller"
              :key="index"
              class="btn policy-card mx-2"
              :class="policy.tipo_carta === 'fascista' ? 'btn-danger' : 'btn-primary'"
              @click="handleChancellorPolicySelection(policy.tipo_carta)"
            >
              {{ policy.tipo_carta === "fascista" ? "Fascista" : "Liberal" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  politicas: {
    type: Array,
    required: true
  },
  isGameOver: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'draw-policies',
  'president-policy-selected',
  'chancellor-policy-selected'
])

const drawnPolicies = ref([])
const showPolicyModal = ref(false)
const politicasParaCanciller = ref([])

const drawPolicies = () => {
  emit('draw-policies')
}

const showPolicySelection = () => {
  showPolicyModal.value = true
}

const handlePresidentPolicySelection = (selectedPolicy) => {
  emit('president-policy-selected', selectedPolicy)
  showPolicyModal.value = false
}

const handleChancellorPolicySelection = (selectedPolicy) => {
  emit('chancellor-policy-selected', selectedPolicy)
}
</script>

<style scoped>
.policy-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
}

.policy-card {
  min-width: 100px;
  font-weight: bold;
}
</style> 