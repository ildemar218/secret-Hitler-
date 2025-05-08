<template>
  <button class="btn btn-outline-primary" @click="mostrarRolAleatorio">
    Mostrar Rol Aleatorio
  </button>
</template>

<script setup>
import Swal from 'sweetalert2'

// Lista de roles con nombre y descripción
const rolesDisponibles = [
  {
    nombre: 'Liberal',
    descripcion: 'Ganas si el tablero se llena con políticas liberales o si Hitler es ejecutado. Pierdes si el tablero se llena con políticas fascistas o si Hitler es elegido canciller después de que se aprueben 3 políticas fascistas. Mantén los ojos abiertos y observa acciones sospechosas. Descubre quién es Hitler, y recuerda que cualquiera podría serlo.'
  },
  {
    nombre: 'Fascista',
    descripcion: 'Ganas si Hitler es elegido canciller con éxito una vez que hay 3 políticas fascistas en el tablero, o si el tablero se llena con políticas fascistas. Pierdes si el tablero se llena con políticas liberales o si Hitler es ejecutado. Mantén la sospecha lejos de Hitler y busca formas de generar confusión en el juego.'
  },
  {
    nombre: 'Hitler',
    descripcion: 'Ganas si eres elegido canciller exitosamente una vez que hay 3 políticas fascistas en el tablero, o si el tablero se llena con políticas fascistas. Pierdes si el tablero se llena con políticas liberales o si eres ejecutado. Intenta ganar la confianza de los demás y apóyate en los otros fascistas para que te abran oportunidades'
  }
]

// Función que muestra el rol y su descripción
function mostrarRolAleatorio() {
  const rol = rolesDisponibles[Math.floor(Math.random() * rolesDisponibles.length)]

  Swal.fire({
    title: `Tu rol es: ${rol.nombre}`,
    html: `
      <div style="font-size: 1.2rem; margin-top: 10px;">
        ${rol.descripcion}
      </div>
    `,
    imageUrl: obtenerIconoPorRol(rol.nombre), // Función para obtener la URL del icono
    imageWidth: 80, // Ajusta el ancho de la imagen según necesites
    imageHeight: 80, // Ajusta la altura de la imagen según necesites
    imageAlt: `Icono de ${rol.nombre}`,
    confirmButtonText: 'Entendido',
    backdrop: true,
    customClass: {
      popup: 'rounded-4'
    }
  })
}

function obtenerIconoPorRol(nombreRol) {
  // Aquí definimos la lógica para retornar la URL de la imagen según el rol
  switch (nombreRol) {
    case 'Liberal':
      return '/assets/avatar.png'; // Reemplaza con la ruta real de tu icono liberal
    case 'Fascista':
      return '/assets/avatar.png'; // Reemplaza con la ruta real de tu icono fascista
    case 'Hitler':
      return '/assets/avatar.png'; // Reemplaza con la ruta real de tu icono de Hitler
    default:
      return "no hay mas imagenes" // Icono por defecto si el rol no coincide
  }
}
</script>