<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Prueba de Componentes</h2>
    
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card p-4">
          <h3 class="text-center mb-3">Pila de Descarte</h3>
          
          <div class="test-section mb-4">
            <h4 class="text-center mb-3">Vista Individual</h4>
            <div class="d-flex justify-content-center mb-4">
              <DiscardPile :cantidad="cantidadCartas" />
            </div>
          </div>

          <div class="test-section mb-4">
            <h4 class="text-center mb-3">Vista en Contexto</h4>
            <PolicyArea
              :politicas="politicasActivas"
              :liberal-progress="progressLiberal"
              :fascist-progress="progressFascista"
              :election-tracker="tracker"
              :num-players="5"
              :cartas-descartadas="cantidadCartas"
            />
          </div>

          <div class="controls text-center">
            <div class="btn-group mb-3">
              <button class="btn btn-primary" @click="agregarCarta">
                Agregar Carta (+1)
              </button>
              <button class="btn btn-success" @click="agregarVarias">
                Agregar 5 Cartas
              </button>
              <button class="btn btn-danger" @click="reiniciarCartas">
                Reiniciar (0)
              </button>
            </div>

            <div class="mt-3">
              <span class="badge bg-secondary me-2">
                Cartas en la pila: {{ cantidadCartas }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DiscardPile from '../components/DiscardPile.vue';
import PolicyArea from '../components/PolicyArea.vue';

const cantidadCartas = ref(0);
const progressLiberal = ref(2);
const progressFascista = ref(1);
const tracker = ref(1);

// Simulación de políticas activas
const politicasActivas = ref([
  { tipo_carta: 'liberal', id: 1 },
  { tipo_carta: 'fascista', id: 2 }
]);

const agregarCarta = () => {
  cantidadCartas.value++;
};

const agregarVarias = () => {
  cantidadCartas.value += 5;
};

const reiniciarCartas = () => {
  cantidadCartas.value = 0;
};
</script>

<style scoped>
.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.test-section {
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 2rem;
}

.test-section:last-child {
  border-bottom: none;
}

.controls {
  padding-top: 1rem;
}

.btn-group .btn {
  margin: 0 0.25rem;
}
</style>