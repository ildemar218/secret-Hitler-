import { createSubCollection, getDocs, query, where } from "./servicesFirebase";

/**
 * Inicializar las cartas (políticas) en la base de datos para una partida.
 * @param {string} idPartida - ID de la partida.
 */
export const initializePolicies = async (idPartida) => {
  try {
    // Crear 6 cartas liberales y 11 cartas fascistas
    const politicas = [
      ...Array(6).fill({ tipo_carta: "liberal", estado: "mazo" }),
      ...Array(11).fill({ tipo_carta: "fascista", estado: "mazo" }),
    ];

    // Mezclar las cartas
    const shuffledPolicies = politicas.sort(() => Math.random() - 0.5);

    // Guardar las cartas en la subcolección "politicas"
    for (let i = 0; i < shuffledPolicies.length; i++) {
      const politicaData = {
        ...shuffledPolicies[i],
        orden: i + 1, // Orden en el mazo
        id_partida: idPartida,
        id_turno: null, // Se asignará cuando se juegue
      };
      await createSubCollection("partidas", idPartida, "politicas", politicaData);
    }

    console.log("Cartas inicializadas con éxito.");
  } catch (error) {
    console.error("Error al inicializar las cartas:", error);
    throw error;
  }
};


export const getThreeRandomPolicies = async (idPartida) => {
  try {
    // Obtener todas las cartas del mazo
    const q = query(
      "politicas",
      where("id_partida", "==", idPartida),
      where("estado", "==", "mazo")
    );
    const querySnapshot = await getDocs(q);
    
    // Convertir a array y mezclar
    const policies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      tipo_carta: doc.data().tipo_carta,
      estado: doc.data().estado
    }));

    // Mezclar aleatoriamente
    const shuffled = policies.sort(() => Math.random() - 0.5);
    
    // Tomar las primeras 3 cartas
    return {
      politicas: shuffled.slice(0, 3)
    };
  } catch (error) {
    console.error("Error al obtener cartas aleatorias:", error);
    throw error;
  }
};