import { createRouter, createWebHistory } from "vue-router";
import Login from "../Views/Login.vue";
import GameBoard from "../Views/GameBoard.vue";
import Register from "../Views/Register.vue";
import PresidentCansillerSelector from "../components/PresidentCansillerSelector.vue";
import JoinGame from "../Views/JoinGame.vue";
import CreateGame from "../Views/CreateGame.vue";
import LandingPage from "../Views/LandingPage.vue";
import Test from "../Views/Test.vue";

const routes = [
  { path: "/login", name: "login", component: Login },
  {
    path: "/gameboard/:codigoSala",
    name: "GameBoard",
    component: GameBoard,
    props: true,
  },
  { path: "/register", name: "register", component: Register },
  { path: "/", name: "register", component: Register },
  { path: "/join-game", name: "join-game", component: JoinGame },
  { path: "/create-game", name: "create-game", component: CreateGame },
  { path: "/test", name: "test", component: Test },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
