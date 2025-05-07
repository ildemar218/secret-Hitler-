<template>
  <div class="container-fluid py-4 rounded-4 board">
    <div class="row justify-content-center mb-4">
      <div
        v-for="index in 5"
        :key="'slot-' + index"
        class="col-2 mx-2 d-flex flex-column align-items-center"
      >
        <div
          class="policy-slot w-100 border border-2 border-black rounded-2"
        ></div>
      </div>
    </div>
    <div class="row justify-content-center align-items-center">
      <!-- Tracker -->
      <div class="d-flex justify-content-around mb-3 col-12 col-md-auto">
        <div
          v-for="(circle, index) in 3"
          :key="'circle-' + index"
          class="tracker-circle-wrapper text-center mx-4"
        >
          <div
            class="outer-circle d-flex justify-content-center align-items-center"
          >
            <div
              :class="[
                'rounded-circle inner-circle',
                index + 1 === failedElections ? 'bg-info' : 'bg-white',
              ]"
            ></div>
          </div>
          <small class="d-block mt-1 text-white-50">Fallida</small>
        </div>
      </div>
      <div class="col-md-5 col-lg-4">
        <div class="special-action text-center p-3 rounded-3">
          <small class="fw-semibold">
            Revela y promulga la primera carta de la pila.<br />
            El marcador vuelve al inicio.
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LiberalBoard",
  data() {
    return {
      failedElections: 1,
    };
  },

  //Aquí se agrega la logica para traer datos en tiempo real de la base de datos y actualizar la variable failedElections
};
</script>

<style scoped>
.board {
  background-color: #5fa3f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.policy-slot {
  width: 100%;
  height: 180px;
  background-color: white;
}
.tracker-circle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.outer-circle {
  width: 44px;
  height: 44px;
  border: 2px solid black;
  border-radius: 50%;
  background-color: white;
}

.inner-circle {
  width: 30px;
  height: 30px;
  border: 2px solid black;
}

.special-action {
  background-color: #dbeeff;
  border: 2px dashed #0d6efd;
  color: #0d1b2a;
}
</style>
