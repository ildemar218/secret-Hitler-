<template>
  <div class="modal-overlay">
    <div class="selector">
      <h5>Elige un Canciller</h5>

      <div class="d-flex flex-wrap justify-content-center mt-3 gap-2">
        <!-- Primera fila -->
        <div class="d-flex justify-content-center w-100 gap-2">
          <button
            v-for="jugador in firstRow"
            :key="jugador.id"
            @click="selectChancellor(jugador)"
            class="player-button"
          >
            <div class="contenedor-imagen mini-imagen">
              <img :src="jugador.imagen || '/image.png'" alt="Imagen" />
            </div>
            <div class="nombre-jugador mini-texto">{{ jugador.nombre }}</div>
          </button>
        </div>

        <!-- Segunda fila -->
        <div class="d-flex justify-content-center w-100 gap-2 mt-2">
          <button
            v-for="jugador in secondRow"
            :key="jugador.id"
            @click="selectChancellor(jugador)"
            class="player-button"
          >
            <div class="contenedor-imagen mini-imagen">
              <img :src="jugador.imagen || '/image.png'" alt="Imagen" />
            </div>
            <div class="nombre-jugador mini-texto">{{ jugador.nombre }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props y eventos
const props = defineProps({
  players: {
    type: Array,
    required: true
  },
  presidentId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['chancellor-selected'])

// Computamos los jugadores disponibles (sin el presidente y los muertos)
const filteredPlayers = computed(() =>
  props.players.filter(jugador => 
    jugador.id !== props.presidentId && 
    jugador.esta_vivo !== false
  )
)

// Dividimos los jugadores en dos filas
const half = computed(() => Math.ceil(filteredPlayers.value.length / 2))
const firstRow = computed(() => filteredPlayers.value.slice(0, half.value))
const secondRow = computed(() => filteredPlayers.value.slice(half.value))

// Función para seleccionar al canciller
function selectChancellor(jugador) {
  emit('chancellor-selected', jugador)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo oscuro con opacidad */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Asegura que el modal esté por encima de otros elementos */
}

.selector {
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  width: 400px; /* Ajusta el tamaño del modal */
  max-height: 80vh;
  overflow-y: auto; /* Permite desplazarse si hay muchos jugadores */
}

.player-button {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 120px;
}

.player-button:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.contenedor-imagen {
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 50%;
  margin: 0 auto;
}

.contenedor-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nombre-jugador {
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
  font-weight: 500;
}

.mini-imagen {
  margin-bottom: 8px;
}

.mini-texto {
  font-size: 14px;
  color: #495057;
}
</style>
