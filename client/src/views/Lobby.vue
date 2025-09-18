<script setup lang="ts">
  import * as api from '../model/api'
  import { ref } from 'vue';
  import {useRouter} from 'vue-router';
  import {usePlayerStore} from '@/stores/player_store';
  import Page from '@/components/Page.vue';

  const playerStore = usePlayerStore()

  const router = useRouter()

  const number_of_players = ref(2)

  const new_game = async (player: string) => {
    const pending_game = await api.new_game(number_of_players.value, player)
    setTimeout(() => router.push(`/pending/${pending_game.id}`), 100)
  }

  if (playerStore.player === undefined)
    router.push('/login')
</script>

<template>
  <Page v-if="playerStore.player">
    <main>
      Number of players: <input min="1" type="number" v-model="number_of_players"/>
      <button @click="new_game(playerStore.player)">New Game</button>
    </main>
  </Page>
</template>
