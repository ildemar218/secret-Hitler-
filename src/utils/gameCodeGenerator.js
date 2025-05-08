import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Genera un código único de 5 caracteres alfanuméricos para una partida
 * @returns {Promise<string>} Código único generado
 */
export const generateGameCode = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let gameCode;
  let gameExists;

  do {
    gameCode = Array.from({length: 5}, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    gameExists = await getDoc(doc(db, "partidas", gameCode));
  } while (gameExists.exists());

  return gameCode;
}; 