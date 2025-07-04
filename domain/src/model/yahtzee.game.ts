import { repeat } from "../utils/array_utils"
import { Randomizer, standardRandomizer, standardShuffler } from "../utils/random_utils"
import { dice_roller, DieValue } from "./dice"
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
  players(): Readonly<String[]>
  scores(): Readonly<PlayerScores[]>
  inTurn(): number
  playerInTurn(): String
  roll(): Readonly<DieValue[]>
  rolls_left(): number
  
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
    _scores: repeat(new_scores(), players.length),
    _playerInTurn: 0,
    _roll: roller.roll(5),
    _rolls_left: 2,
    roller
  }

  return from_memento(memento)
}

export function from_memento(memento: YahtzeeMemento): Yahtzee {
  const roller = memento.roller
  const players = memento.players
  let scores = memento._scores.map(s => ({...s}))
  let playerInTurn = memento._playerInTurn
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
      _scores: scores,
      _playerInTurn: playerInTurn,
      _roll: roll,
      _rolls_left: rolls_left,
      roller
    }
  }

  function clone() {
    return from_memento(to_memento())
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
    players: () => players,
    scores: () => scores,
    inTurn: () => playerInTurn,
    playerInTurn: () => players[playerInTurn],
    roll: () => roll,
    rolls_left: () => rolls_left,
    to_memento,
    clone,
    reroll,
    register
  }
}
