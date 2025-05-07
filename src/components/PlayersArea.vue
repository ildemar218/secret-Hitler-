<template>
  <div class="players-container mb-4">
    <div v-if="players.length > 0" class="d-flex justify-content-center">
      <PlayerContainer
        v-for="player in players"
        :key="player.id"
        :nombre="player.nombre"
        :rol="getPlayerRole(player)"
        :imagen="player.imagen"
      />
    </div>
    <div v-else>
      <p>No hay jugadores disponibles.</p>
    </div>
  </div>
</template>

<script>
import PlayerContainer from './PlayerContainer.vue';

export default {
  name: 'PlayersArea',
  components: {
    PlayerContainer
  },
  props: {
    players: {
      type: Array,
      required: true
    },
    currentPresident: {
      type: Object,
      default: null
    },
    currentChancellor: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const getPlayerRole = (player) => {
      if (player.id === props.currentPresident?.id) return 'presidente';
      if (player.id === props.currentChancellor?.id) return 'canciller';
      return player.rol;
    };

    return {
      getPlayerRole
    };
  }
};
</script>

<style scoped>
.players-container {
  width: 100%;
  overflow-x: auto;
  padding: 1rem;
  margin-bottom: 2rem;
}
</style> 