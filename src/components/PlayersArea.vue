<template>
  <div class="players-container mb-4">
    <div v-if="players.length > 0" class="d-flex justify-content-center flex-wrap">
      <PlayerContainer
        v-for="player in players"
        :key="player.id"
        :nombre="player.nombre"
        :rol="getPlayerRole(player)"
        :imagen="player.imagen"
        :cargo="getCargo(player)"
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
    },
    currentUser: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {

    const getCargo = (player) => {
  if (player.id === props.currentPresident?.id) return 'presidente';
  if (player.id === props.currentChancellor?.id) return 'canciller';
  return null;
};

const getPlayerRole = (player) => {
  const currentUser = props.currentUser;
  if (!currentUser || !player) return ' ';

  const isMe = player.id === currentUser.id;
  if (isMe) return player.rol;

  const myPlayer = props.players.find(p => p.id === currentUser.id);
  if (!myPlayer) return ' ';

  if (myPlayer.rol === 'liberal') return ' ';
  if (myPlayer.rol === 'fascista') {
    return (player.rol === 'fascista' || player.rol === 'hitler') ? player.rol : ' ';
  }
  if (myPlayer.rol === 'hitler') {
    return player.rol === 'fascista' ? 'fascista' : ' ';
  }

  return ' ';
};



    return {
      getPlayerRole,
      getCargo
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