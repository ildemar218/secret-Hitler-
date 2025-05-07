<template>
  <div class="container text-center">
    <h1>Test Component</h1>
    <div class="d-flex w-100 justify-content-center gap-4 mb-4">
      <PlayerContainer
        nombre="Carlos"
        imagen="/public/image.png"
        rol="Presidente"
      /><PlayerContainer
        nombre="Kevin"
        imagen="/public/image.png"
        rol="Canciller"
      /><PlayerContainer
        nombre="Juan"
        imagen="/public/image.png"
      /><PlayerContainer
        nombre="James"
        imagen="/public/image.png"
      /><PlayerContainer nombre="Sebastian" imagen="/public/image.png" />
    </div>
    <LiberalBoard />
    <FascistBoard playerCount="9" />
    <div class="container mt-5 d-flex justify-content-center gap-4">
      <PolicyCard tipo="fascista" />
      <PolicyCard tipo="liberal" />
    </div>
  </div>
</template>

<script>
import PlayerContainer from "../components/PlayerContainer.vue";
import FascistBoard from "../components/FascistBoard.vue";
import LiberalBoard from "../components/LiberalBoard.vue";
import PolicyCard from "../components/PolicyCard.vue";

export default {
  name: "Test",
  components: {
    PlayerContainer,
    FascistBoard,
    LiberalBoard,
    PolicyCard,
  },
};
</script>

<style scoped>
/* Add styles for testing if needed */
</style>
