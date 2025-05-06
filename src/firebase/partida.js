import { collection, doc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase.js"; // asegúrate que tu inicialización está en firebase.js

async function crearPartidaConJugadores() {
  try {
    const codigoSala = generarCodigoSala();

    const partidaRef = doc(db, "partidas", codigoSala);

    await setDoc(partidaRef, {
      codigo: codigoSala,
      estado: "esperando",
      presidente_actual: "6ikFJdFwGeN7SQnhG07cE9Wc6012",
      canciller_actual: null,
      fallo_consecutivo: 0,
      fallos: 0,
      politicas_aprobadas: 0,
      tablero_fascista: {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
      },
      tablero_liberal: {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
      },
      poderes: [],
      created_at: Timestamp.now()
    });

    console.log(`Partida creada con código de sala / ID: ${codigoSala}`);

    const roles = mezclarArray([
      "liberal", "liberal", "liberal", "liberal",
      "fascista", "fascista", "fascista", "hitler"
    ]);

    for (let i = 0; i < 8; i++) {
      const jugadorRef = doc(collection(partidaRef, "jugadores_partida"));
      await setDoc(jugadorRef, {
        id_usuario: `usuario_${i + 1}`,
        nombre: `Jugador ${i + 1}`,
        rol: roles[i],
        orden_turno: i,
        esta_vivo: true,
        conectado: true
      });
      console.log(`Jugador ${i + 1} creado con rol: ${roles[i]}`);
    }

    console.log("Todos los jugadores fueron creados correctamente.");
  } catch (error) {
    console.error("Error creando la partida:", error);
  }
}

// Utilidades
function generarCodigoSala(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function mezclarArray(arr) {
  return arr
    .map((valor) => ({ valor, orden: Math.random() }))
    .sort((a, b) => a.orden - b.orden)
    .map((obj) => obj.valor);
}

// Llamada principal
crearPartidaConJugadores();
