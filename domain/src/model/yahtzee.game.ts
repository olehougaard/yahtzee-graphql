import { repeat } from "../utils/array_utils"
import { Randomizer, standardRandomizer, standardShuffler } from "../utils/random_utils"
import { dice_roller, DiceRoller, DieValue } from "./dice"
import { YahtzeeMemento } from "./yahtzee.game.memento"
import { register as register_player, is_finished as is_finished_player, registered, total, new_scores, PlayerScores } from "./yahtzee.score"
import { SlotKey } from "./yahtzee.slots"

export type YahtzeeSpecs = {
  creator?: string,
  players: string[],
  number_of_players?: number,
}

export type YahtzeeOptions = YahtzeeSpecs & {
  randomizer?: Randomizer
}

export interface Yahtzee {
  readonly roller: DiceRoller

  players(): Readonly<String[]>
  scores(): Readonly<PlayerScores[]>
  inTurn(): number
  playerInTurn(): String
  roll(): Readonly<DieValue[]>
  rolls_left(): number

  total_scores(): number[]
  is_finished(): boolean
  
  to_memento(): YahtzeeMemento
  clone(): Yahtzee

  reroll(held: number[]): void
  register(slot: SlotKey): void
}

export function new_yahtzee({players, number_of_players, randomizer = standardRandomizer}: Readonly<YahtzeeOptions>): Yahtzee {
  if (number_of_players && players.length !== number_of_players)
    throw new Error('Wrong number of players: ' + players.length)
  
  const roller = dice_roller(randomizer)
  players = standardShuffler(randomizer, players)
  
  const memento: YahtzeeMemento = {
    players,
    scores: repeat(new_scores(), players.length),
    playerInTurn: 0,
    roll: roller.roll(5),
    rolls_left: 2
  }

  return from_memento(memento, dice_roller(randomizer))
}

export function from_memento(memento: YahtzeeMemento, roller: DiceRoller = dice_roller(standardRandomizer)): Yahtzee {
  const players = memento.players
  let scores: PlayerScores[] = memento.scores.map(s => ({...s}))
  let playerInTurn = memento.playerInTurn
  let roll = memento.roll
  let rolls_left = 2

  function reroll(held: number[]) {
    if (rolls_left === 0) 
      throw new Error('No more rolls')
    roll = roller.reroll(roll, held)
    rolls_left--
  }

  function to_memento(): YahtzeeMemento {
    return {
      players,
      scores: scores,
      playerInTurn: playerInTurn,
      roll: roll,
      rolls_left: rolls_left,
    }
  }

  function clone() {
    return from_memento(to_memento(), roller)
  }

  function is_finished(): boolean {
    return scores.every(is_finished_player)
  }

  function register(slot: SlotKey) {
    if (registered(scores[playerInTurn], slot)) 
      throw new Error("Cannot overwrite score")
    scores[playerInTurn] = register_player(scores[playerInTurn], slot, roll)
    playerInTurn = (playerInTurn + 1) % players.length
    roll = roller.roll(5)
    rolls_left = 2
  }

  return {
    roller,
    players: () => players,
    scores: () => scores,
    inTurn: () => playerInTurn,
    playerInTurn: () => players[playerInTurn],
    roll: () => roll,
    rolls_left: () => rolls_left,
    total_scores: () => scores.map(total),
    is_finished,
    to_memento,
    clone,
    reroll,
    register
  }
}
