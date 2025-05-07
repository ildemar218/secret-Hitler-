<template>
  <div v-if="visible" class="voting-system">
    <h2>Votación para el Canciller: {{ chancellorName }}</h2>

    <div class="buttons">
      <button @click="handleVote('ja')" :disabled="hasVoted">Ja ✅</button>
      <button @click="handleVote('nein')" :disabled="hasVoted">Nein ❌</button>
    </div>

    <p>Votos restantes: {{ remainingVotes }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useVoting } from '@/composables/useVoting';

const props = defineProps({
  gameId: String,
  chancellorName: String,
  totalPlayers: Number,
  playerId: String,
  visible: Boolean,
  onFinish: Function
});

const { votes, jaCount, neinCount, vote, fetchVotes } = useVoting(props.gameId);

onMounted(fetchVotes);

const hasVoted = computed(() => {
  return votes.value.some(v => v.playerId === props.playerId);
});

const remainingVotes = computed(() => props.totalPlayers - votes.value.length);

// Revisa si ya terminó la votación
watch(votes, () => {
  if (votes.value.length >= props.totalPlayers) {
    const result = jaCount.value > neinCount.value ? 'Aprobado' : 'Rechazado';
    props.onFinish(result);
  }
});

const handleVote = (voteValue) => {
  vote(props.playerId, voteValue);
};
</script>

<style scoped>
.voting-system {
  border: 2px solid #ccc;
  padding: 1rem;
  border-radius: 10px;
  background-color: #f9f9f9;
  text-align: center;
}
.buttons button {
  margin: 0 1rem;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
}
</style>
