import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  collectionGroup,
  writeBatch,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";
import { generateGameCode } from '../utils/gameCodeGenerator';
import { assignRoles } from '../utils/roleAssigner';

/**
 * Crear un documento en una subcolección dentro de una subcolección
 */
export const createNestedSubcollectionDocument = async (
  rootCollection,
  rootDocId,
  firstSubcollection,
  firstSubDocId,
  secondSubcollection,
  data
) => {
  try {
    const nestedDocRef = doc(
      db,
      rootCollection,
      rootDocId,
      firstSubcollection,
      firstSubDocId,
      secondSubcollection,
      crypto.randomUUID()
    );
    await setDoc(nestedDocRef, data);
    console.log("Documento creado en sub-subcolección.");
  } catch (error) {
    console.error("Error al crear en sub-subcolección:", error);
  }
};

/**
 * Crear una nueva partida
 * @param {Object} user - Usuario autenticado
 * @returns {Promise<string>} Código de la partida
 */
export const createGame = async (user) => {
  if (!user) throw new Error('Usuario no autenticado');
  
  const gameCode = await generateGameCode();
  
  const gameData = {
    codigo: gameCode,
    estado: 'esperando',
    id_presidente: null,
    id_canciller: null,
    turnoActual: 0,
    fascistProgress: 0,
    liberalProgress: 0,
      fase: null,
    electionTracker: 0,
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
    poderes: []
  };

  await setDoc(doc(db, 'partidas', gameCode), gameData);
  
  // Añadir host como jugador
  await addPlayer(gameCode, {
    idJugador: user.uid,
    nombreEnJuego: user.displayName || 'Jugador Anónimo',
    esHost: true,
    ordenTurno: 1
  });

  return gameCode;
};

/**
 * Crear un nuevo turno en una partida.
 */
export const createTurn = async (idPartida, numeroTurno, idPresidenteJugador) => {
  try {
    const turnoData = {
      id_partida: idPartida,
      numero: numeroTurno,
      id_presidente_jugador: idPresidenteJugador,
      id_canciller_jugador: null,
      resultado: null,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
    };
    await createSubCollection("partidas", idPartida, "turnos", turnoData);
    console.log("Turno creado con éxito.");
  } catch (error) {
    console.error("Error al crear el turno:", error);
    throw error;
  }
};

/**
 * Inicializar las políticas en una partida
 * @param {string} idPartida 
 */
export const initializePolicies = async (idPartida) => {
  try {
    const politicas = [
      ...Array(6).fill({ tipo_carta: "liberal", tipo_origen: "mazo" }),
      ...Array(11).fill({ tipo_carta: "fascista", tipo_origen: "mazo" }),
    ];

    // Mezclar las políticas
    const shuffledPolicies = politicas.sort(() => Math.random() - 0.5);

    // Crear las políticas en la subcolección
    for (let i = 0; i < shuffledPolicies.length; i++) {
      const politicaData = {
        ...shuffledPolicies[i],
        estado: "mazo",
        orden: i + 1,
        id_turno: null,
        id_partida: idPartida,
      };
      await setDoc(
        doc(db, 'partidas', idPartida, 'politicas', `politica_${i + 1}`),
        politicaData
      );
    }
  } catch (error) {
    console.error("Error al inicializar las políticas:", error);
    throw error;
  }
};

/**
 * Leer todos los documentos de una subcolección anidada
 */
export const getNestedSubcollection = async (
  rootCollection,
  rootDocId,
  firstSubcollection,
  firstSubDocId,
  secondSubcollection
) => {
  try {
    const nestedSubRef = collection(
      db,
      rootCollection,
      rootDocId,
      firstSubcollection,
      firstSubDocId,
      secondSubcollection
    );
    const snapshot = await getDocs(nestedSubRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al leer sub-subcolección:", error);
  }
};

/**
 * Actualizar un documento específico en una subcolección anidada
 */
export const updateNestedSubcollectionDocument = async (
  rootCollection,
  rootDocId,
  firstSubcollection,
  firstSubDocId,
  secondSubcollection,
  secondSubDocId,
  newData
) => {
  try {
    const docRef = doc(
      db,
      rootCollection,
      rootDocId,
      firstSubcollection,
      firstSubDocId,
      secondSubcollection,
      secondSubDocId
    );
    await updateDoc(docRef, newData);
    console.log("Documento actualizado en sub-subcolección.");
  } catch (error) {
    console.error("Error al actualizar sub-subcolección:", error);
  }
};

/**
 * Eliminar un documento específico en una sub-subcolección
 */
export const deleteNestedSubcollectionDocument = async (
  rootCollection,
  rootDocId,
  firstSubcollection,
  firstSubDocId,
  secondSubcollection,
  secondSubDocId
) => {
  try {
    const docRef = doc(
      db,
      rootCollection,
      rootDocId,
      firstSubcollection,
      firstSubDocId,
      secondSubcollection,
      secondSubDocId
    );
    await deleteDoc(docRef);
    console.log("Documento eliminado en sub-subcolección.");
  } catch (error) {
    console.error("Error al eliminar de sub-subcolección:", error);
  }
};

/**
 * Escuchar cambios en tiempo real en una sub-subcolección
 */
export const onSnapshotNestedSubcollection = (
  rootCollection,
  rootDocId,
  firstSubcollection,
  firstSubDocId,
  secondSubcollection,
  callback
) => {
  try {
    const nestedSubRef = collection(
      db,
      rootCollection,
      rootDocId,
      firstSubcollection,
      firstSubDocId,
      secondSubcollection
    );

    const unsubscribe = onSnapshot(nestedSubRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(data);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error al escuchar sub-subcolección:", error);
  }
};

// Funciones CRUD para Firestore

export const emptyCollection = async (nombreColeccion) => {
  try {
    // Obtén una referencia a la colección
    const coleccionRef = collection(db, nombreColeccion);

    // Agrega un documento temporal
    const docRef = await addDoc(coleccionRef, {
      temporal: true,
    });

    console.log("Documento temporal agregado con ID: ", docRef.id);

    // Elimina el documento temporal inmediatamente
    await deleteDoc(doc(db, nombreColeccion, docRef.id));

    console.log("Documento temporal eliminado");
  } catch (e) {
    console.error("Error al crear la colección: ", e);
  }
};

export const createDocument = async (nombreColeccion, dataDocument, idEspecifico = null) => {
  try {
    if (idEspecifico) {
      await setDoc(doc(db, nombreColeccion, idEspecifico), dataDocument);
      return idEspecifico;
    } else {
      const docRef = await addDoc(collection(db, nombreColeccion), dataDocument);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error al crear documento:", error);
    throw error;
  }
};

export const readCollection = async (nombreColeccion) => {
  try {
    const querySnapshot = await getDocs(collection(db, nombreColeccion));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al leer colección:", error);
    throw error;
  }
};

export const readSubcollection = async (nombreColeccion, idDocumentoPrincipal, nombreSubcoleccion) => {
  try {
    const querySnapshot = await getDocs(collection(db, nombreColeccion, idDocumentoPrincipal, nombreSubcoleccion));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al leer subcolección:", error);
    throw error;
  }
};

export const readDocumentById = async (nombreColeccion, id) => {
  try {
    const docRef = doc(db, nombreColeccion, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error("Error al leer documento:", error);
    throw error;
  }
};

export const queryDocuments = async (nombreColeccion, campo, valor) => {
  try {
    const q = query(collection(db, nombreColeccion), where(campo, "==", valor));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al consultar documentos:", error);
    throw error;
  }
};

export const querySingleDocument = async (nombreColeccion, campo, valor) => {
  try {
    // Obtén una referencia a la colección
    const coleccionRef = collection(db, nombreColeccion);

    // Filtra los documentos por el campo y valor especificados
    const consulta = query(coleccionRef, where(campo, "==", valor));

    // Obtén los documentos filtrados
    const querySnapshot = await getDocs(consulta);

    // Verifica si se encontró un solo documento
    if (!querySnapshot.empty && querySnapshot.size === 1) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      console.log("No se encontró el documento o hay más de uno con ese valor.");
      return null;
    }
  } catch (e) {
    console.error("Error al consultar el documento: ", e);
  }
}

export const updateDocument = async (nombreColeccion, id, dataDocument) => {
  try {
    const docRef = doc(db, nombreColeccion, id);
    await updateDoc(docRef, dataDocument);
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    throw error;
  }
};

export const updateSubcollectionDocument = async (nombreColeccion, idDocumentoPrincipal, nombreSubcoleccion, idSubdocumento, dataDocument) => {
  try {
    const docRef = doc(db, nombreColeccion, idDocumentoPrincipal, nombreSubcoleccion, idSubdocumento);
    await updateDoc(docRef, dataDocument);
  } catch (error) {
    console.error("Error al actualizar documento en subcolección:", error);
    throw error;
  }
};

export const deleteDocument = async (nombreColeccion, id) => {
  try {
    await deleteDoc(doc(db, nombreColeccion, id));
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    throw error;
  }
};

export const deleteCollection = async (nombreColeccion) => {
  try {
    // Obtén una referencia a la colección
    const coleccionRef = collection(db, nombreColeccion);

    // Obtén todos los documentos de la colección
    const querySnapshot = await getDocs(coleccionRef);

    // Elimina cada documento
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
      console.log("Documento eliminado con ID: ", doc.id);
    });
  } catch (e) {
    console.error("Error al eliminar la colección: ", e);
  }
};

export const createSubCollection = async (nombreColeccion, idDocumento, nombreSubColeccion, dataDocument) => {
  try {
    const docRef = await addDoc(collection(db, nombreColeccion, idDocumento, nombreSubColeccion), dataDocument);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear subcolección:", error);
    throw error;
  }
};

//Mantener actualizacion en tiempo real de una coleccion
export const onSnapshotCollection = (nombreColeccion, callback) => {
  try {
    return onSnapshot(collection(db, nombreColeccion), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error("Error al escuchar colección:", error);
    throw error;
  }
};

export const onSnapshotSubcollection = (nombreColeccion, idDocumento, nombreSubColeccion, callback) => {
  try {
    return onSnapshot(collection(db, nombreColeccion, idDocumento, nombreSubColeccion), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error("Error al escuchar subcolección:", error);
    throw error;
  }
};

//Mantener actualizacion en tiempo real de un documento
export const onSnapshotDocument = (nombreColeccion, id, callback) => {
  try {
    return onSnapshot(doc(db, nombreColeccion, id), (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } : null);
    });
  } catch (error) {
    console.error("Error al escuchar documento:", error);
    throw error;
  }
};

export const onSnapshotSubcollectionWithFullData = (
  nombreColeccion,
  idDocumentoPrincipal,
  nombreSubcoleccion,
  callback
) => {
  try {
    // Obtén una referencia a la subcolección
    const subcoleccionRef = collection(
      db,
      nombreColeccion,
      idDocumentoPrincipal,
      nombreSubcoleccion
    );

    // Escucha los cambios en tiempo real en la subcolección
    const unsubscribe = onSnapshot(subcoleccionRef, async (snapshot) => {
      // Mapea la información de jugadores_partida
      const datosSubcoleccion = snapshot.docs.map((doc) => ({
        idJugadorPartida: doc.id, // ID del jugador
        ...doc.data(), // Otros campos de jugadores_partida
      }));

      // Consulta los nombres correspondientes desde la colección "jugadores"
      for (const jugador of datosSubcoleccion) {
        const jugadorDocRef = doc(db, "jugadores", jugador.idJugador);
        const jugadorDoc = await getDoc(jugadorDocRef);

        if (jugadorDoc.exists()) {
          jugador.nombre = jugadorDoc.data().nombre; // Añade el nombre al jugador
        } else {
          jugador.nombre = "Desconocido"; // Si no se encuentra, asigna un valor por defecto
        }
      }

      // Ejecuta el callback con los datos completos
      callback(datosSubcoleccion);
    });

    return unsubscribe; // Devuelve la función para cancelar la suscripción
  } catch (e) {
    console.error("Error al escuchar la subcolección con nombres:", e);
  }
};

export const listenToSubcollectionFiltered = (subcollection, callback, field = "place", value = "mano") => {
  const subcollectionQuery = query(
    collectionGroup(db, subcollection), // Subcolección parametrizada
    where(field, "==", value) // Filtrar por campo y valor personalizados
  );

  const unsubscribe = onSnapshot(subcollectionQuery, (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Datos filtrados de '${subcollection}' por ${field}='${value}':`, data);
    callback(data); // Llama al callback con los datos filtrados
  });

  return unsubscribe; // Retorna una función para detener la escucha
};

export const listenToMultipleSubcollections = (subcollections, callback, field , value) => {
  const unsubscribes = [];

  subcollections.forEach((subcollection) => {
    const subcollectionQuery = query(
      collectionGroup(db, subcollection), // Subcolección dinámica
      where(field, "==", value) // Filtrar por campo y valor
    );

    const unsubscribe = onSnapshot(subcollectionQuery, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data(), subcollection }); // Agregar el nombre de la subcolección
      });

      console.log(`Datos filtrados de '${subcollection}' por ${field}='${value}':`, data);
      callback(data, subcollection); // Devolver datos y subcolección al callback
    });

    unsubscribes.push(unsubscribe);
  });

  // Retornar función para detener todas las suscripciones
  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
};

export const enrichDataWithField = async (data, targetCollection, fieldToMatch, fieldToRetrieve) => {
  // Mapea los datos y enriquece cada entrada con información de la colección objetivo
  console.log("datos enrich",data)
  const enrichedData = await Promise.all(
    data.map(async (item) => {
      const docRef = doc(db, targetCollection, item[fieldToMatch]); // Documento en la colección objetivo
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          ...item, // Mantén los datos originales
          [fieldToRetrieve]: docSnap.data()[fieldToRetrieve], // Añade el campo solicitado
        };
      } else {
        return {
          ...item,
          [fieldToRetrieve]: "Desconocido", // Valor por defecto si no se encuentra el documento
        };
      }
    })
  );

  return enrichedData; // Devuelve los datos enriquecidos
};

export const deleteQuerySubcolletionBatch = async (nombreColeccion, idDocumento, subcoleccion, campo, valor) => {
  try {
    const subcoleccionRef = collection(db, nombreColeccion, idDocumento, subcoleccion);
    const consulta = query(subcoleccionRef, where(campo, "==", valor));

    // Obtener documentos que cumplen el criterio
    const snapshot = await getDocs(consulta);

    if (!snapshot.empty) {
      // Crear una instancia de WriteBatch
      const batch = writeBatch(db);

      // Agregar cada documento al batch para ser eliminado
      snapshot.docs.forEach((docSnap) => {
        const docRef = doc(db, nombreColeccion, idDocumento, subcoleccion, docSnap.id);
        batch.delete(docRef);
      });

      // Confirmar todas las operaciones en el batch
      await batch.commit();
      console.log(`Se eliminaron ${snapshot.size} documentos en la subcolección "${subcoleccion}" con el criterio: ${campo} = ${valor}.`);
    } else {
      console.log(`No se encontraron documentos en la subcolección "${subcoleccion}" con el criterio: ${campo} = ${valor}.`);
    }
  } catch (error) {
    console.error("Error al eliminar en la subcolección con WriteBatch:", error);
  }
};

export const deleteDocumentFromSubcollection = async (
  nombreColeccion,       // Ej: "partidas"
  idDocumentoPrincipal,  // Ej: "ID_partida"
  nombreSubcoleccion,    // Ej: "jugadores"
  idSubdocumento         // Ej: "ID_jugador"
) => {
  try {
    const docRef = doc(
      db,
      nombreColeccion,
      idDocumentoPrincipal,
      nombreSubcoleccion,
      idSubdocumento
    );
    await deleteDoc(docRef);
    console.log(`✔ Documento eliminado de ${nombreSubcoleccion}: ${idSubdocumento}`);
  } catch (e) {
    console.error(`✘ Error al eliminar:`, e);
    throw e; // Recomendado para manejar el error donde se llame a la función
  }
}; // <--- Único cierre necesario (cierra la función)

/**
 * Iniciar una partida existente
 * @param {string} gameCode - Código de la partida
 * @param {string} hostId - ID del usuario host
 * @param {Array} players - Lista de jugadores
 */
export const startGame = async (gameCode, hostId, players) => {
  if (players.length < 5) {
    throw new Error('Se requieren mínimo 5 jugadores');
  }

  const batch = writeBatch(db);
  const gameRef = doc(db, 'partidas', gameCode);
  
  // 1. Asignar roles
  const roles = assignRoles(players.length);
  
  // Obtener los documentos actuales de los jugadores
  const jugadoresRef = collection(db, 'partidas', gameCode, 'jugadores_partida');
  const jugadoresSnapshot = await getDocs(jugadoresRef);
  const jugadoresDocs = jugadoresSnapshot.docs;

  // Actualizar cada jugador existente
  for (let i = 0; i < players.length; i++) {
    // Encontrar el documento del jugador por su idJugador
    const jugadorDoc = jugadoresDocs.find(doc => doc.data().idJugador === players[i].idJugador);
    if (!jugadorDoc) {
      console.error(`No se encontró el documento para el jugador ${players[i].idJugador}`);
      continue;
    }

    const playerRef = doc(db, 'partidas', gameCode, 'jugadores_partida', jugadorDoc.id);
    batch.update(playerRef, {
      rol: roles[i],
      inclinacion: roles[i] === 'liberal' ? 'liberal' : 'fascista',
      estaVivo: true,
      ordenTurno: i + 1
    });
  }

  // 2. Inicializar políticas
  await initializePolicies(gameCode);

  // 3. Actualizar estado de partida
  batch.update(gameRef, {
    estado: 'iniciada',
    turnoJugadorId: hostId,
    tablero:{
      fase:"postulacion"
    }

  });

  await batch.commit();
};

/**
 * Obtener datos de una partida
 * @param {string} gameCode 
 * @returns {Promise<Object>}
 */
export const getGame = async (gameCode) => {
  const snapshot = await getDoc(doc(db, 'partidas', gameCode));
  return snapshot.exists() ? snapshot.data() : null;
};

/**
 * Escuchar cambios en el estado de la partida
 * @param {string} gameCode 
 * @param {Function} callback 
 */
export const onGameStateChange = (gameCode, callback) => {
  return onSnapshot(doc(db, 'partidas', gameCode), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

/**
 * Añadir un jugador a una partida
 * @param {string} gameCode 
 * @param {Object} playerData 
 */
export const addPlayer = async (codigoPartida, jugadorData) => {
  try {
    // Verificar si el jugador ya existe en la partida
    const jugadoresRef = collection(db, "partidas", codigoPartida, "jugadores_partida");
    const q = query(jugadoresRef, where("idJugador", "==", jugadorData.idJugador));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("El jugador ya existe en la partida");
      return null;
    }

    // Si el jugador no existe, añadirlo
    const docRef = await addDoc(jugadoresRef, {
      ...jugadorData,
      fecha_union: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error al añadir jugador:", error);
    throw error;
  }
};

/**
 * Obtener todos los jugadores de una partida
 * @param {string} gameCode 
 * @returns {Promise<Array>}
 */
export const getPlayers = async (gameCode) => {
  const snapshot = await getDocs(
    collection(db, 'partidas', gameCode, 'jugadores_partida')
  );
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Escuchar cambios en los jugadores de la partida
 * @param {string} gameCode 
 * @param {Function} callback 
 */
export const onPlayersChange = (gameCode, callback) => {
  return onSnapshot(
    collection(db, 'partidas', gameCode, 'jugadores_partida'),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

/**
 * Agregar un jugador a una partida
 */
export const addPlayerToGame = async (idPartida, playerData) => {
  try {
    const partidaRef = doc(db, 'partidas', idPartida);
    await updateDoc(partidaRef, {
      players: arrayUnion(playerData)
    });
  } catch (error) {
    console.error("Error al agregar jugador:", error);
    throw error;
  }
};

/**
 * Remover un jugador de una partida
 */
export const removePlayerFromGame = async (idPartida, playerData) => {
  try {
    const partidaRef = doc(db, 'partidas', idPartida);
    await updateDoc(partidaRef, {
      players: arrayRemove(playerData)
    });
  } catch (error) {
    console.error("Error al remover jugador:", error);
    throw error;
  }
};

/**
 * Crear una nueva votación
 * @param {string} idPartida - ID de la partida
 * @param {Object} votacionData - Datos de la votación
 * @returns {Promise<string>} ID de la votación creada
 */
export const createVotacion = async (idPartida, votacionData) => {
  try {
    const votacionRef = doc(collection(db, 'partidas', idPartida, 'votaciones'));
    await setDoc(votacionRef, {
      ...votacionData,
      fecha_creacion: serverTimestamp()
    });
    return votacionRef.id;
  } catch (error) {
    console.error("Error al crear votación:", error);
    throw error;
  }
};

/**
 * Agregar un voto a una votación
 * @param {string} idPartida - ID de la partida
 * @param {string} idVotacion - ID de la votación
 * @param {Object} votoData - Datos del voto
 */
export const addVoto = async (idPartida, idVotacion, votoData) => {
  try {
    const votoRef = doc(collection(db, 'partidas', idPartida, 'votaciones', idVotacion, 'votos'));
    await setDoc(votoRef, {
      ...votoData,
      fecha_voto: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al agregar voto:", error);
    throw error;
  }
};

/**
 * Obtener los votos de una votación
 * @param {string} idPartida - ID de la partida
 * @param {string} idVotacion - ID de la votación
 * @returns {Promise<Array>} Lista de votos
 */
export const getVotos = async (idPartida, idVotacion) => {
  try {
    const votosRef = collection(db, 'partidas', idPartida, 'votaciones', idVotacion, 'votos');
    const snapshot = await getDocs(votosRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener votos:", error);
    throw error;
  }
};

/**
 * Actualizar una votación
 * @param {string} idPartida - ID de la partida
 * @param {string} idVotacion - ID de la votación
 * @param {Object} updateData - Datos a actualizar
 */
export const updateVotacion = async (idPartida, idVotacion, updateData) => {
  try {
    const votacionRef = doc(db, 'partidas', idPartida, 'votaciones', idVotacion);
    await updateDoc(votacionRef, updateData);
  } catch (error) {
    console.error("Error al actualizar votación:", error);
    throw error;
  }
};

/**
 * Escuchar cambios en los votos de una votación
 * @param {string} idPartida - ID de la partida
 * @param {string} idVotacion - ID de la votación
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para cancelar la suscripción
 */
export const onVotosChange = (idPartida, idVotacion, callback) => {
  const votosRef = collection(db, 'partidas', idPartida, 'votaciones', idVotacion, 'votos');
  return onSnapshot(votosRef, (snapshot) => {
    const votos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(votos);
  });
};
