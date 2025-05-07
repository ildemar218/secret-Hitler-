import { ref, computed } from "vue";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query
} from "firebase/firestore";

export function useVoting(gameId) {
  const votes = ref([]);
  const loading = ref(true);

  const fetchVotes = () => {
    const q = query(collection(db, `games/${gameId}/votaciones`));
    onSnapshot(q, (snapshot) => {
      votes.value = snapshot.docs.map(doc => doc.data());
      loading.value = false;
    });
  };

  const vote = async (playerId, voteValue) => {
    const alreadyVoted = votes.value.find(v => v.playerId === playerId);
    if (!alreadyVoted) {
      await addDoc(collection(db, `games/${gameId}/votaciones`), {
        playerId,
        vote: voteValue
      });
    }
  };

  const jaCount = computed(() => votes.value.filter(v => v.vote === "ja").length);
  const neinCount = computed(() => votes.value.filter(v => v.vote === "nein").length);

  return {
    votes,
    jaCount,
    neinCount,
    loading,
    vote,
    fetchVotes
  };
}
