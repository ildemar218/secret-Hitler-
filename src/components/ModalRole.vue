<template>
  <!-- Modal -->
  <div
    class="modal fade"
    id="lealtadModal"
    tabindex="-1"
    aria-labelledby="lealtadModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 text-center p-3">
        <div class="modal-header">
          <h5
            class="fw-bold w-100"
            id="lealtadModalLabel"
            v-if="politicalParty"
          >
            {{
              politicalParty === "hitler"
                ? "¡Eres "
                : "¡Tu partido politico es el"
            }}
            <span
              :class="{
                'text-danger': politicalParty.toLowerCase() === 'fascista',
                'text-primary': politicalParty.toLowerCase() === 'liberal',
                'text-warning': politicalParty.toLowerCase() === 'hitler',
              }"
            >
              {{ politicalParty }} </span
            >!
          </h5>
        </div>
        <div
          class="modal-body d-flex justify-content-center align-items-center gap-3"
        >
          <img
            src="/public/image.png"
            class="rounded mx-auto d-block mb-3"
            alt="Avatar"
            width="80"
            height="80"
          />
          <div v-if="politicalParty === 'fascista'">
            <p>
              Ganas si Hitler es elegido canciller con éxito después de que se
              hayan aprobado 3 políticas fascistas, o si el tablero se llena
              completamente con políticas fascistas. Pierdes si el tablero se
              llena con políticas liberales o si Hitler es ejecutado. Tu
              objetivo es desviar la sospecha de Hitler y sembrar la confusión
              entre los demás jugadores.
            </p>
          </div>
          <div v-if="politicalParty === 'liberal'">
            <p>
              Ganas si el tablero se llena con políticas liberales o si Hitler
              es ejecutado. Pierdes si el tablero se llena con políticas
              fascistas o si Hitler es elegido canciller después de que se
              aprueben tres políticas fascistas. Mantén los ojos bien abiertos y
              observa cualquier comportamiento sospechoso. Descubre quién es
              Hitler… recuerda que cualquiera podría serlo.
            </p>
          </div>
          <div v-if="politicalParty === 'hitler'">
            <p>
              Ganas si eres elegido canciller con éxito después de que se
              aprueben tres políticas fascistas, o si el tablero se llena
              completamente con políticas fascistas. Pierdes si el tablero se
              llena con políticas liberales o si eres ejecutado. Gana la
              confianza de los demás jugadores y colabora con tus compañeros
              fascistas para crear oportunidades a tu favor.
            </p>
          </div>
        </div>
        <div class="modal-footer justify-content-center">
          <button type="button" class="btn btn-success" data-bs-dismiss="modal">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalRole",
  props: {
    politicalParty: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.modal-content {
  border: 1px solid #ccc;
}

.modal-body p {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  text-align: justify;
}

.btn-success {
  width: 80px;
  border-radius: 1rem;
}
</style>
