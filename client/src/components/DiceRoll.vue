<script setup lang="ts">
  import { reactive, computed, watch } from 'vue'
  import * as api from '../model/api'
  import type { IndexedYahtzee } from '@/model/game';
  
  const { game, player, enabled } = defineProps<{game: IndexedYahtzee, player: string, enabled: boolean}>()

  const held = reactive([false, false, false, false, false])

  const reroll_enabled = computed(() => game && game.rolls_left > 0 && enabled)
  watch(() => reroll_enabled.value, e => {
    if (!e) {
      for(let i in held) {
        held[i] = false
      }
    }
  })

  async function reroll() {
    const heldIndices = held.map((b, i) => b ? i : undefined).filter(i => i !== undefined);
    api.reroll(game, heldIndices, player)
  }
</script>

<template>
  <div class="dice">
    <div v-if="!enabled" class="diceheader">{{game.players[game.playerInTurn]}} is playing</div>
    <div class="die"></div>
    <div v-for="d in game.roll" :class="`die die${d}`">{{d}}</div>
    <div class="caption">{{(enabled && reroll_enabled)? 'Hold:' : ''}}</div>
    <input  v-if="enabled && reroll_enabled" v-for="(_, i) in game.roll" type="checkbox" v-model="held[i]"/>
    <div v-if="enabled && reroll_enabled" class="reroll">
      <button @click="reroll()">Re-roll</button>
    </div>
  </div>
</template>

<style>
  .diceheader {
    grid-row: 1;
    grid-column: 2 / 6;
    font-size: x-large;
    margin-bottom: 1rem;
  }
  .dice {
    display:grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 2fr;
  }
  .die {
    grid-row: 2;
    text-align: center;
  }
  .die1 {
    content: url(@/assets/1.png);
  }
  .die2 {
    content: url(@/assets/2.png);
  }
  .die3 {
    content: url(@/assets/3.png);
  }
  .die4 {
    content: url(@/assets/4.png);
  }
  .die5 {
    content: url(@/assets/5.png);
  }
  .die6 {
    content: url(@/assets/6.png);
  }
  .reroll {
    grid-row: 2;
    text-align: center;
  }
  .reroll button {
    padding: auto;
  }
  .caption {
    grid-row: 3;
    margin-left: 1rem;
  }
  .dice input {
    grid-row: 3;
  }
</style>
