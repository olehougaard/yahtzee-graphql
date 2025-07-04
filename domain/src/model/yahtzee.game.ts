import { repeat, update } from "../utils/array_utils"
import { Randomizer, standardRandomizer, standardShuffler } from "../utils/random_utils"
import { dice_roller, DiceRoller, DieValue } from "./dice"
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

export interface YahtzeeMemento {
  players: string[],
  scores: PlayerScores[],
  playerInTurn: number,
  _roll: DieValue[],
  _rolls_left: number,
  roller: DiceRoller
}

export interface Yahtzee extends YahtzeeMemento {
  reroll(held: number[]): void
  clone(): Yahtzee
  roll(): Readonly<DieValue[]>
  rolls_left(): number
}

export function new_yahtzee({players, number_of_players, randomizer = standardRandomizer}: Readonly<YahtzeeOptions>): Yahtzee {
  if (number_of_players && players.length !== number_of_players)
    throw new Error('Wrong number of players: ' + players.length)
  
  const roller = dice_roller(randomizer)
  players = standardShuffler(randomizer, players)
  
  const memento = {
    players,
    scores: repeat(new_scores(), players.length),
    playerInTurn: 0,
    _roll: roller.roll(5),
    _rolls_left: 2,
    roller
  }

  return from_memento(memento)
}

export function from_memento(memento: YahtzeeMemento): Yahtzee {
  const roller = memento.roller
  const players = memento.players
  let scores = memento.scores.map(s => ({...s}))
  let playerInTurn = memento.playerInTurn
  let roll = memento._roll
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
      scores,
      playerInTurn,
      _roll: roll,
      _rolls_left: rolls_left,
      roller
    }
  }

  function clone() {
    return from_memento(to_memento())
  }

  return {
    players,
    scores,
    playerInTurn,
    _roll: roll,
    _rolls_left: rolls_left,
    roller,
    reroll,
    clone,
    roll: () => roll,
    rolls_left: () => rolls_left 
  }
}

export function reroll(held: number[], yahtzee: Yahtzee): Yahtzee {
  yahtzee.reroll(held)
  return yahtzee
}

export function register(slot: SlotKey, yahtzee: Yahtzee): YahtzeeMemento {
    const { playerInTurn, scores } = yahtzee
    const roll = yahtzee.roll()
    if (registered(scores[playerInTurn], slot)) throw new Error("Cannot overwrite score")
    return {
      ...yahtzee,
      scores: update(playerInTurn, register_player(scores[playerInTurn], slot, roll), scores),
      playerInTurn: (playerInTurn + 1) % yahtzee.players.length,
      _roll: yahtzee.roller.roll(5),
      _rolls_left: 2
    }
}

export function scores(yahtzee: Omit<YahtzeeMemento, 'roller'>): number[] {
  return yahtzee.scores.map(total)
}

export function is_finished(yahtzee: Omit<YahtzeeMemento, 'roller'>): boolean {
  return yahtzee.scores.every(is_finished_player)
}
