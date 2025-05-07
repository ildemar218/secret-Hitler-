<template>
  <div class="policy-area">
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

    <div class="policy-cards">
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
  </div>
</template>

<script>
import LiberalCard from './LiberalCard.vue';
import FascistCard from './FascistCard.vue';

export default {
  name: 'PolicyArea',
  components: {
    LiberalCard,
    FascistCard
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
    }
  },
  emits: ['policy-effect'],
  setup(props, { emit }) {
    const handleFascistEffect = () => {
      emit('policy-effect');
    };

    return {
      handleFascistEffect
    };
  }
};
</script>

<style scoped>
.policy-area {
  margin: 2rem 0;
}

.policy-cards {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
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
</style> 