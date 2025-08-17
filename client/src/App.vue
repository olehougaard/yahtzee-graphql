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

  onMounted(async () => {
    api.onGame(game => {
        ongoingGamesStore.upsert(game)
        pendingGamesStore.remove(game)
    })
    api.onPending(pendingGamesStore.upsert)

    const games = await api.games()
    games.forEach(ongoingGamesStore.upsert)

    const pending_games = await api.pending_games()
    pending_games.forEach(pendingGamesStore.upsert)
  })
</script>

<template>
  <h1 class="header">Yahtzee!</h1>
  <h2 v-if="playerStore.player" class="subheader">Welcome player {{playerStore.player}}</h2>
  <nav v-if="playerStore.player">
    <RouterLink class='link' to="/">Lobby</RouterLink>
    
    <h2>My Games</h2>
    <h3>Ongoing</h3>
    <RouterLink class='link' v-for="game in my_ongoing_games" :to="`/game/${game.id}`">Game #{{game.id}}</RouterLink>
    
    <h3>Waiting for players</h3>
    <RouterLink class='link' v-for="game in my_pending_games" :to="`/pending/${game.id}`">Game #{{game.id}}</RouterLink>
    
    <h2>Available Games</h2>
    <RouterLink class='link' v-for="game in other_pending_games" :to="`/pending/${game.id}`">Game #{{game.id}}</RouterLink>
  </nav>
  
  <RouterView class='main'/>
</template>

<style>
  #app {
    background-color: rgb(243, 244, 245);
    margin: 0;
    padding: 0.6rem;
  }
  html {
    height: 100%;
  }
  body {
    width: 1024px;
    height: 100%;
    margin: 0 auto;
    background-color:rgb(20, 30, 47);
    padding: 0;
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