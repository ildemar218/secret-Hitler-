<template>
  <div class="discard-pile text-center px-3 py-2" role="status" :aria-label="ariaLabel">
    <div class="cards-stack" :class="{ 'card-added': hasNewCard }">
      <!-- Simulación visual de cartas apiladas -->
      <div v-for="index in stackedCards" :key="index" 
           class="card-overlay"
           :style="{ transform: `translateY(${(index - 1) * -4}px)` }"
           :class="{ 
             'more-cards': cantidad > 3,
             'card-added': hasNewCard 
           }"
      ></div>
      <div class="counter-badge" :class="{ 'large-number': cantidad > 99 }">
        <transition name="counter" mode="out-in">
          <span :key="cantidad">{{ cantidad }} {{ cardText }}</span>
        </transition>
      </div>
    </div>
    <span class="visually-hidden">{{ ariaLabel }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  cantidad: {
    type: Number,
    required: true,
    default: 0,
    validator: (value) => value >= 0
  }
});

const hasNewCard = ref(false);

// Observar cambios en la cantidad para activar la animación
watch(() => props.cantidad, (newVal, oldVal) => {
  if (newVal > oldVal) {
    hasNewCard.value = true;
    setTimeout(() => {
      hasNewCard.value = false;
    }, 300); // Duración de la animación
  }
});

// Número de cartas a mostrar en la pila visual (máximo 5)
const stackedCards = computed(() => 
  Math.min(Math.max(props.cantidad, 1), 5)
);

// Texto para el contador
const cardText = computed(() => 
  props.cantidad === 1 ? 'carta' : 'cartas'
);

// Texto para lectores de pantalla
const ariaLabel = computed(() => 
  `Pila de descarte con ${props.cantidad} ${cardText.value}`
);
</script>

<style scoped>
.discard-pile {
  position: relative;
  display: inline-block;
}

.cards-stack {
  position: relative;
  width: 100px;
  height: 140px;
  background-color: #e9ecef;
  border: 2px solid #6c757d;
  border-radius: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.cards-stack:hover {
  transform: translateY(-4px);
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #dee2e6;
  border: 2px solid #6c757d;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.card-overlay.more-cards {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Animación cuando se agrega una nueva carta */
@keyframes cardAdded {
  0% {
    transform: translateY(-20px) scale(1.1);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.card-added {
  animation: cardAdded 0.3s ease-out;
}

.counter-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 10;
  min-width: 60px;
  backdrop-filter: blur(2px);
}

.counter-badge.large-number {
  font-size: 0.8rem;
  padding: 6px 8px;
}

/* Transiciones para el contador */
.counter-enter-active,
.counter-leave-active {
  transition: all 0.3s ease;
}

.counter-enter-from,
.counter-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Clases de utilidad para accesibilidad */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 576px) {
  .cards-stack {
    width: 80px;
    height: 112px;
  }
  
  .counter-badge {
    font-size: 0.8rem;
    padding: 4px 8px;
  }
}
</style>
