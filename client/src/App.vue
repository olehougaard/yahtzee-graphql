<script setup lang="ts">
  import { RouterLink, RouterView } from 'vue-router'
  import { computed, onMounted } from 'vue'
  import { useOngoingGamesStore } from './stores/ongoing_games_store';
  import * as api from './model/api'
  import {usePlayerStore} from './stores/player_store';
  import {usePendingGamesStore} from './stores/pending_games_store';
  
  const ongoingGamesStore = useOngoingGamesStore()
  const pendingGamesStore = usePendingGamesStore()
  const playerStore = usePlayerStore()
  
  const isParticipant = (g: {players: readonly string[]}) => g.players.indexOf(playerStore.player ?? '') > -1
  
  const my_ongoing_games = computed(() => ongoingGamesStore.games.filter(g => isParticipant(g.to_memento()) && !g.is_finished()))
  const my_pending_games = computed(() => pendingGamesStore.games.filter(isParticipant))
  const other_pending_games = computed(() => pendingGamesStore.games.filter(g => !isParticipant(g)))
  
  async function initGames() {
    const games = await api.games();
    games.forEach(ongoingGamesStore.upsert);
    
    const pending_games = await api.pending_games();
    pending_games.forEach(pendingGamesStore.upsert);
  }
  
  function liveUpdateGames() {
    api.onGame(game => {
      ongoingGamesStore.upsert(game);
      pendingGamesStore.remove(game);
    });
    api.onPending(pendingGamesStore.upsert);
  }
  
  onMounted(async () => {
    await initGames();
    liveUpdateGames();
  })
</script>

<template>
  <h1 class="header">Yahtzee!</h1>
  
  <RouterView/>
</template>

<style>
  #app {
    background-color: rgb(243, 244, 245);
    margin: 10px;
    padding: 0.6rem;
    overflow: auto;
  }
  html {
    height: 100%;
  }
  body {
    width: 1024px;
    height: 100%;
    margin: 0 auto;
    background-color:rgb(20, 30, 47);
  }
  nav {
    margin-left: 5%;
    float: right;
  }
  .link {
    margin: .3rem;
    display: block;
  }
</style>