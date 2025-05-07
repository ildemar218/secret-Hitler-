<template>
  <div class="policy-area">
    <!-- Área de tableros -->
    <div class="boards-container">
      <div class="mb-4">
        <div class="d-flex justify-content-center">
          <LiberalCard
            :passedPolicies="liberalProgress"
            :trackerPosition="electionTracker"
          />
        </div>
      </div>

      <div class="mb-4">
        <div class="d-flex justify-content-center">
          <FascistCard
            v-if="fascistProgress >= 0 && fascistProgress <= 6 && electionTracker >= 0 && electionTracker <= 3"
            :passedPolicies="fascistProgress"
            :trackerPosition="electionTracker"
            :currentPlayerCount="numPlayers"
            @policy-effect="handleFascistEffect"
          />
        </div>
      </div>
    </div>

    <!-- Área de cartas y descarte -->
    <div class="cards-section">
      <div class="d-flex justify-content-center align-items-center gap-4">
        <div class="policy-cards" v-if="politicas.length > 0">
          <div v-for="(policy, index) in politicas" :key="index" class="policy-card">
            <div :class="['card', policy.tipo_carta === 'liberal' ? 'bg-primary' : 'bg-danger']">
              <div class="card-body">
                <h5 class="card-title text-white">
                  {{ policy.tipo_carta === 'liberal' ? 'Liberal' : 'Fascista' }}
                </h5>
              </div>
            </div>
          </div>
        </div>

        <DiscardPile 
          :cantidad="totalCartasDescartadas" 
          class="discard-section"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import LiberalCard from './LiberalCard.vue';
import FascistCard from './FascistCard.vue';
import DiscardPile from './DiscardPile.vue';

export default {
  name: 'PolicyArea',
  components: {
    LiberalCard,
    FascistCard,
    DiscardPile
  },
  props: {
    politicas: {
      type: Array,
      required: true
    },
    liberalProgress: {
      type: Number,
      required: true
    },
    fascistProgress: {
      type: Number,
      required: true
    },
    electionTracker: {
      type: Number,
      required: true
    },
    numPlayers: {
      type: Number,
      required: true
    },
    cartasDescartadas: {
      type: Number,
      required: true,
      default: 0
    }
  },
  emits: ['policy-effect'],
  setup(props, { emit }) {
    // Computed property para el total de cartas descartadas
    const totalCartasDescartadas = computed(() => 
      props.cartasDescartadas
    );

    const handleFascistEffect = () => {
      emit('policy-effect');
    };

    return {
      totalCartasDescartadas,
      handleFascistEffect
    };
  }
};
</script>

<style scoped>
.policy-area {
  margin: 2rem 0;
}

.boards-container {
  margin-bottom: 2rem;
}

.cards-section {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 1rem;
}

.policy-cards {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.policy-card {
  width: 100px;
  height: 150px;
  perspective: 1000px;
}

.card {
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.discard-section {
  min-width: 100px;
}

@media (max-width: 768px) {
  .cards-section {
    padding: 1rem;
  }

  .policy-card {
    width: 80px;
    height: 120px;
  }

  .card-body {
    padding: 0.5rem;
  }
}
</style>