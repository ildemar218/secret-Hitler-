<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>Votación para Canciller</h2>
      <p>¿Aprobar a {{ chancellorName }} como Canciller?</p>
      <div class="voting-buttons">
        <button class="btn btn-success" @click="submitVote('ja')">Ja</button>
        <button class="btn btn-danger" @click="submitVote('nein')">Nein</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      required: true
    },
    chancellorName: {
      type: String,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    }
  },
  emits: ['vote-submitted'],
  setup(props, { emit }) {
    const submitVote = (vote) => {
      emit('vote-submitted', {
        userId: props.currentUserId,
        vote: vote
      });
    };

    return {
      submitVote
    };
  }
};
</script>

<style scoped>
.modal-overlay {
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
  text-align: center;
}

.voting-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
}
</style> 