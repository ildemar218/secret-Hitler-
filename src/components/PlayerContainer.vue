<template>
  <div class="player-card">
    <div v-if="rol === 'canciller'" class="role-badge chancellor-badge">
      Canciller
    </div>
    <img :src="imagen" alt="Imagen del jugador" class="player-image" />
    <div class="player-name">{{ nombre }}</div>
    <div class="player-role">
      {{ rol === 'presidente' ? 'Presidente' : rol }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  nombre: {
    type: String,
    required: true,
  },
  rol: {
    type: String,
    required: true,
  },
  imagen: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.player-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  background-color: #f9f9f9;
  width: 120px; /* Tamaño fijo para las tarjetas */
  margin: 0 10px; /* Espacio entre tarjetas */
  display: inline-block; /* Para que las tarjetas se muestren en línea */
  position: relative; /* Para posicionar el badge */
}

.role-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 2;
}

.chancellor-badge {
  background-color: #ffc107;
  color: #000;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.player-image {
  width: 80px;
  height: 80px;
  border-radius: 50%; /* Hace que la imagen sea circular */
  object-fit: cover; /* Ajusta la imagen para que no se deforme */
  margin-bottom: 0.5rem;
}

.player-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
  white-space: nowrap; /* Evita que el nombre se rompa en múltiples líneas */
  overflow: hidden; /* Oculta el texto que se desborde */
  text-overflow: ellipsis; /* Muestra ... cuando el texto es muy largo */
}

.player-role {
  font-size: 0.9rem;
  color: #666;
}

.players-container {
  display: flex;
  flex-wrap: nowrap; /* No permite que los elementos se ajusten a la siguiente fila */
  justify-content: center;
  gap: 1rem; /* Espacio entre tarjetas */
  overflow-x: auto; /* Permite desplazamiento horizontal si hay desbordamiento */
  padding: 1rem; /* Espacio alrededor del contenedor */
  width: 100%; /* Ancho completo */
}
</style>
