<template>
  <div>
    <VotingSystem
      v-if="showVoting"
      :gameId="gameId"
      :chancellorName="chancellorName"
      :totalPlayers="totalPlayers"
      :playerId="playerId"
      :visible="showVoting"
      :onFinish="handleVotingResult"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import VotingSystem from '@/components/VotingSystem.vue';

const showVoting = ref(false);
const gameId = "partida_123";
const chancellorName = ref("Hans Müller");
const totalPlayers = 5;
const playerId = "jugador_789";

const handleVotingResult = (result) => {
  alert(`Resultado de la votación: ${result}`);
  showVoting.value = false;
};

</script>
