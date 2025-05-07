<template>
  <div class="container-fluid p-4 board rounded-4">
    <div class="row justify-content-center gx-1 mb-3">
      <div
        v-for="(slot, index) in 6"
        :key="'slot-' + index"
        class="col d-flex flex-column align-items-center px-2"
      >
        <div
          class="border d-flex justify-content-center align-items-center text-center rounded-3"
          :style="getSlotStyle(index)"
        >
          <small v-if="computedPowers[index]" class="fw-bold p-3">{{
            computedPowers[index]
          }}</small>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-10 d-flex justify-content-center">
        <div
          class="border text-center px-3 py-2"
          style="background-color: #f9cfc9; width: 100%"
        >
          <small>
            {{ message }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  name: "FascistBoard",
  props: {
    playerCount: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const message = ref("");

    return {
      message,
    };
  },
  computed: {
    computedPowers() {
      const powers = {
        0: "",
        1: "",
        2: "⚡ El presidente examina las 3 primeras cartas",
        3: "⚡ El presidente debe ejecutar un jugador",
        4: "⚡ El presidente debe ejecutar un jugador y se activa poder de veto",
        5: "",
      };

      if (this.playerCount >= 7 && this.playerCount <= 8) {
        powers[1] =
          "⚡ El presidente investiga la carta de identidad de un jugador";
        this.message =
          "7 o 8 jugadores: juega con 2 fascistas y Hitler, Hitler desconoce la identidad de los fascistas";
      } else if (this.playerCount >= 9) {
        powers[0] =
          "⚡ El presidente investiga la carta de identidad de un jugador";
        this.message =
          "9 o 10 jugadores: juega con 3 fascistas y Hitler, Hitler desconoce la identidad de los fascistas";
        powers[1] =
          "⚡ El presidente investiga la carta de identidad de un jugador";
      } else {
        this.message =
          "5 o 6 jugadores: juega con 1 fascista y Hitler, Hitler conoce la identidad del fascista";
      }

      return powers;
    },
  },
  methods: {
    getSlotStyle(index) {
      return {
        width: "100%",
        height: "200px",
        backgroundColor: "#fff5f5",
        whiteSpace: "pre-line",
      };
    },
  },
};
</script>

<style scoped>
.board {
  background-color: #e74c3c;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.border {
  border: 2px solid black !important;
}
</style>
