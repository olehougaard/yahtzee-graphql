import { repeat } from "../utils/array_utils"
import { Randomizer, standardRandomizer, standardShuffler } from "../utils/random_utils"
import { dice_roller, DiceRoller, DieValue } from "./dice"
import { YahtzeeMemento } from "./yahtzee.game.memento"
import { from_memento as from_score_memento, PlayerScores } from "./yahtzee.score"
import { new_scores_memento } from "./yahtzee.score.memento"
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
    scores: repeat(new_scores_memento(), players.length),
    playerInTurn: 0,
    roll: roller.roll(5),
    rolls_left: 2
  }

  return from_memento(memento, dice_roller(randomizer))
}

export function from_memento(memento: YahtzeeMemento, roller: DiceRoller = dice_roller(standardRandomizer)): Yahtzee {
  const players = memento.players
  let scores: PlayerScores[] = memento.scores.map(from_score_memento)
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
      scores: scores.map(s => s.to_memento()),
      playerInTurn: playerInTurn,
      roll: roll,
      rolls_left: rolls_left,
    }
  }

  function clone() {
    return from_memento(to_memento(), roller)
  }

  function is_finished(): boolean {
    return scores.every(s => s.is_finished())
  }

  function register(slot: SlotKey) {
    scores[playerInTurn].register(slot, roll)
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
    total_scores: () => scores.map(s => s.total()),
    is_finished,
    to_memento,
    clone,
    reroll,
    register
  }
}
