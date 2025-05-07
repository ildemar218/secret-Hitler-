<template>
  <div :class="['politica-card', tipoClass]">
    <div class="icono">
      {{ emoji }}
    </div>
    <div class="titulo">
      {{ tipo.toUpperCase() }}
    </div>
    <div class="subtitulo">POLÍTICA</div>
  </div>
</template>

<script>
export default {
  name: "PolicyCard",
  props: {
    tipo: {
      type: String,
      required: true,
      validator: (val) => ["fascista", "liberal"].includes(val.toLowerCase()),
    },
  },
  computed: {
    tipoClass() {
      return this.tipo.toLowerCase();
    },
    emoji() {
      return this.tipo.toLowerCase() === "fascista" ? "💀" : "🕊️";
    },
  },
};
</script>

<style scoped>
.politica-card {
  width: 140px;
  height: 200px;
  border: 6px solid;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  font-family: "Impact", "Arial Black", sans-serif;
  background-color: #fffbe6;
  position: relative;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
}

.fascista {
  border-color: #d32f2f;
  color: #d32f2f;
}

.liberal {
  border-color: #00bcd4;
  color: #00bcd4;
}

.icono {
  font-size: 36px;
  margin-bottom: 8px;
}

.titulo {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
}

.subtitulo {
  font-size: 14px;
  font-weight: bold;
  margin-top: 4px;
}
</style>
