<template>
  <div v-if="showModal" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-title">Cartas Robadas</h2>
      <div class="policy-cards-container">
        <div v-for="(policy, index) in policies" :key="index" class="policy-card">
          <div :class="['card', policy.tipo_carta === 'liberal' ? 'bg-primary' : 'bg-danger']">
            <div class="card-body">
              <h5 class="card-title text-white">
                {{ policy.tipo_carta === 'liberal' ? 'Liberal' : 'Fascista' }}
              </h5>
            </div>
          </div>
        </div>
      </div>
      <button @click="closeModal" class="btn btn-secondary">Cerrar</button>
    </div>
  </div>
</template>

<script>
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebase.js"; // Make sure to import db

export default {
  name: 'PolicyModal',
  props: {
    gameId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showModal: false,
      policies: []
    };
  },
  methods: {
    async show() {
      try {
        // Obtener 3 políticas del mazo
        const politicasRef = collection(db, "partidas", this.gameId, "politicas");
        const q = query(politicasRef, where("estado", "==", "mazo"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty || snapshot.docs.length < 3) {
          console.error("No hay suficientes políticas en el mazo");
          return;
        }

        // Tomar las primeras 3 políticas
        this.policies = snapshot.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("Cartas obtenidas:", this.policies);

        this.showModal = true;
      } catch (error) {
        console.error('Error al obtener cartas:', error);
      }
    },
    closeModal() {
      this.showModal = false;
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
/* Your existing styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 90%;
}

.modal-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.policy-cards-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.policy-card {
  width: 100px;
  height: 150px;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-body {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.card-title {
  font-size: 1.2rem;
  text-align: center;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 5px;
  font-size: 1rem;
}
</style>