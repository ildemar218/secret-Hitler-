/**
 * Asigna roles a los jugadores según el número total de jugadores
 * @param {number} playerCount - Número total de jugadores
 * @returns {Array<string>} Array de roles asignados
 */
export const assignRoles = (playerCount) => {
  const roles = [];
  
  // 1 Hitler
  roles.push("hitler");
  
  // 1/3 fascistas (redondeado arriba)
  const fascists = Math.ceil((playerCount - 1) / 3);
  for (let i = 0; i < fascists; i++) {
    roles.push("fascista");
  }
  
  // Resto liberales
  while (roles.length < playerCount) {
    roles.push("liberal");
  }
  
  // Mezclar los roles
  return roles.sort(() => Math.random() - 0.5);
}; 