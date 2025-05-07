<template>
  <div class="container-fluid py-4" style="background-color: #5fa3f0">
    <!-- Recuadros grandes (cartas políticas) -->
    <div class="row justify-content-center mb-3">
      <div
        v-for="index in 5"
        :key="'slot-' + index"
        class="col-2 m-1 d-flex flex-column align-items-center"
      >
        <div
          class="border"
          style="width: 100%; height: 200px; background-color: white"
        ></div>
      </div>
    </div>

    <!-- Marcador de elecciones fallidas + Acción final -->
    <div class="row justify-content-center">
      <!-- Marcador de elecciones fallidas -->
      <div
        v-for="(circle, index) in 3"
        :key="'circle-' + index"
        class="col-2 m-1 d-flex flex-column align-items-center"
      >
        <div
          class="border rounded-circle bg-white d-flex justify-content-center align-items-center"
          style="width: 40px; height: 40px"
        >
          <div
            :class="[
              'rounded-circle m-1',
              index + 1 === failedElections ? 'bg-black' : 'bg-white',
            ]"
            style="width: 30px; height: 30px; border: 2px solid black"
          ></div>
        </div>
        <small class="mt-1">Fallida</small>
      </div>

      <!-- Acción especial final -->
      <div class="col-4 m-1 d-flex flex-column align-items-center">
        <div
          class="border text-center px-3 py-2"
          style="background-color: #cce0ff; width: 100%"
        >
          <small>
            Revela y promulga la primera carta de la pila. El marcador vuelve al
            inicio.
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
      failedElections: 3,
    };
  },

  //Aquí se agrega la logica para traer datos en tiempo real de la base de datos y actualizar la variable failedElections
};
</script>

<style scoped>
.border {
  border: 2px solid black !important;
}
</style>
