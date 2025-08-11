import type { DieValue } from "domain/src/model/dice"
import { from_memento, type Yahtzee, type YahtzeeSpecs } from "domain/src/model/yahtzee.game"
import type { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento"
import type { SlotKey } from "domain/src/model/yahtzee.slots"

type Indexed<Y, pending extends boolean> = Readonly<Y & {id: string, pending: pending}>

export type IndexedYahtzee = Indexed<Yahtzee, false>

export type IndexedYahtzeeMemento = Indexed<YahtzeeMemento, false>

export type IndexedYahtzeeSpecs = Indexed<YahtzeeSpecs, true>

export function from_memento_indexed(m: IndexedYahtzeeMemento): IndexedYahtzee {
  return {...from_memento(m), id: m.id, pending: m.pending}
}

type GraphQlGame = { 
  id: string, 
  players: string[], 
  playerInTurn: number, 
  roll: DieValue[], 
  rolls_left: number, 
  scores: {slot: SlotKey, score: number | null}[][]
}

function from_graphql_player_scores(player_scores: {slot: SlotKey, score: number | null}[]) {
  return player_scores.filter(s => s.score != null).map(({slot, score}) => [slot, score])
}

export function from_graphql_game({ id, players, playerInTurn, roll, rolls_left, scores }: GraphQlGame): IndexedYahtzee {
  const entries = scores.map(from_graphql_player_scores)
  const m: IndexedYahtzeeMemento = {
    id, pending: false, players, playerInTurn, roll, rolls_left, scores: entries.map(Object.fromEntries)
  }
  return from_memento_indexed(m)
}
