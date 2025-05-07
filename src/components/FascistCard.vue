<template>
  <div class="fascist-card-container">
    <div class="fascist-card position-relative bg-dark rounded shadow-lg">
      <!-- Tablero base fascista -->
      <img 
        :src="fascistBoardImage" 
        :alt="`${passedPolicies} políticas fascistas aprobadas`"
        class="board-image img-fluid rounded"
      />
      
      <!-- Fichas de políticas aprobadas -->
      <div v-for="i in maxPolicies" :key="`fascist-policy-${i}`">
        <img
          v-if="i <= passedPolicies"
          :src="fascistPolicyImage"
          alt="Política fascista aprobada"
          class="position-absolute policy-token"
          :style="getPolicyTokenStyle(i)"
        />
      </div>

      <!-- Rastreador de elecciones -->
      <div class="election-tracker position-absolute">
          <img
            v-for="pos in maxTrackerPositions"
            :key="`tracker-${pos}`"
            :src="electionTrackerImage"
            :alt="`Rastreador en posición ${pos} de ${maxTrackerPositions}`"
            class="position-absolute tracker-marker"
            :class="{ 'd-none': pos !== trackerPosition }"
            :style="{ left: getTrackerPosition(pos) }"
          />
      </div>

      <!-- Poderes especiales -->
      <div class="special-powers position-absolute">
        <div 
          v-for="(power, index) in specialPowers" 
          :key="`power-${index}`"
          class="power-indicator"
          :class="{ 
            'active': passedPolicies >= power.requiredPolicies,
            'inactive': passedPolicies < power.requiredPolicies
          }"
          :style="getPowerIndicatorStyle(index)"
          :title="power.description"
        >
          <span class="power-number">{{ power.requiredPolicies }}</span>
          <span class="power-tooltip">{{ power.description }}</span>
        </div>
      </div>

      <!-- Mensaje de victoria fascista -->
      <div 
        v-if="passedPolicies >= 6" 
        class="victory-message position-absolute text-center"
      >
        <h3 class="text-danger">¡Victoria Fascista!</h3>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import fascistBoardImage from '../assets/board-fascist.png'
import fascistPolicyImage from '../assets/policy-fascist.png'
import electionTrackerImage from '../assets/election-tracker.png';

export default {
  name: 'FascistCard',
  props: {
    trackerPosition: {
      type: Number,
      required: true,
      validator: value => value >= 0 && value <= 3,
      default: 1
    },
    passedPolicies: {
      type: Number,
      required: true,
      validator: value => value >= 0 && value <= 6,
      default: 0
    },
    currentPlayerCount: {
      type: Number,
      required: true,
      default: 5
    }
  },
  data() {
    return {
      fascistBoardImage,
      fascistPolicyImage,
      electionTrackerImage,
      maxPolicies: 6,
      maxTrackerPositions: 3,
      policyPositions: ['11%', '24.6%', '38.2%', '50.8%', '63.4%', '77%']
    }
  },
  computed: {
    specialPowers() {
      const powers = [
        { requiredPolicies: 1, description: 'Inspeccionar lealtad' },
        { requiredPolicies: 2, description: 'Ver la próxima política' },
        { requiredPolicies: 3, description: 'Elegir próximo presidente' },
        { requiredPolicies: 4, description: 'Ejecutar a un jugador' },
        { requiredPolicies: 5, description: 'Ejecutar a un jugador' }
      ];

      // Ajustar poderes según número de jugadores
      if (this.currentPlayerCount <= 6) {
        powers[0].requiredPolicies = 1;
        powers[1].requiredPolicies = 2;
        powers[2].requiredPolicies = 3;
        powers[3].requiredPolicies = 4;
        powers[4].requiredPolicies = 5;
      } else if (this.currentPlayerCount <= 8) {
        powers[0].requiredPolicies = 1;
        powers[1].requiredPolicies = 2;
        powers[2].requiredPolicies = 3;
        powers[3].requiredPolicies = 4;
        powers[4].requiredPolicies = 5;
      } else { // 9-10 jugadores
        powers[0].requiredPolicies = 1;
        powers[1].requiredPolicies = 1;
        powers[2].requiredPolicies = 2;
        powers[3].requiredPolicies = 3;
        powers[4].requiredPolicies = 4;
      }

      return powers.filter(power => power.requiredPolicies <= 5);
    }
  },
  methods: {
    getPolicyTokenStyle(index) {
      return {
        left: `calc(${this.policyPositions[index - 1]})`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '12%',
        zIndex: 10,
        filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.7))'
      };
    },
    getTrackerPosition(pos) {
      const positions = ['20%', '40%', '60%'];
      return positions[pos - 1] || '0%';
    },
    getPowerIndicatorStyle(index) {
      // Posiciones verticales para los indicadores de poder
      const topPositions = ['15%', '30%', '45%', '60%', '75%'];
      return {
        top: topPositions[index] || '0%',
        right: '10%'
      };
    }
  },
  mounted() {
    console.log('Fascist Card Mounted - Policies:', this.passedPolicies, 'Tracker:', this.trackerPosition);
  }
}
</script>

<style scoped>
.fascist-card-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.fascist-card {
  width: 400px;
  max-width: 100%;
  padding: 1rem;
  background-color: #343a40 !important;
  border: 3px solid #dc3545;
}

.board-image {
  width: 100%;
  border: 3px solid #495057;
}

.policy-token {
  transition: all 0.3s ease;
}

.special-powers {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.power-indicator {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: help;
  transition: all 0.3s ease;
  z-index: 15;
}

.power-indicator.active {
  background-color: #dc3545;
  color: white;
  box-shadow: 0 0 10px rgba(220, 53, 69, 0.7);
}

.power-indicator.inactive {
  background-color: #6c757d;
  color: white;
  border: 2px solid #495057;
}

.power-tooltip {
  position: absolute;
  left: 40px;
  width: 150px;
  padding: 5px;
  background-color: #343a40;
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 20;
}

.power-indicator:hover .power-tooltip {
  opacity: 1;
}

.victory-message {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 1rem 2rem;
  border-radius: 8px;
  z-index: 30;
  width: 80%;
}

.victory-message h3 {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@media (max-width: 576px) {
  .fascist-card {
    width: 320px;
  }
  
  .policy-token {
    width: 15% !important;
  }

  .power-indicator {
    width: 25px;
    height: 25px;
    font-size: 0.8rem;
  }

  .power-tooltip {
    width: 120px;
    font-size: 0.7rem;
  }
}
</style>