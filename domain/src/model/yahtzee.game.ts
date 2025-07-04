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

export type Yahtzee = Readonly<{
  players: string[],
  scores: PlayerScores[],
  playerInTurn: number,
  roll: DieValue[],
  rolls_left: number,
  roller: DiceRoller
}>

export function new_yahtzee({players, number_of_players, randomizer = standardRandomizer}: Readonly<YahtzeeOptions>): Yahtzee {
  if (number_of_players && players.length !== number_of_players)
    throw new Error('Wrong number of players: ' + players.length)
  const roller = dice_roller(randomizer)
  return {
    players: standardShuffler(randomizer, players),
    scores: repeat(new_scores(), players.length),
    playerInTurn: 0,
    roll: roller.roll(5),
    rolls_left: 2,
    roller
  }
}

export function reroll(held: number[], yahtzee: Yahtzee): Yahtzee {
  if (yahtzee.rolls_left === 0) throw new Error('No more rolls')
  return { 
    ...yahtzee, 
    roll: yahtzee.roller.reroll(yahtzee.roll, held),
    rolls_left: yahtzee.rolls_left - 1
  }
}

export function register(slot: SlotKey, yahtzee: Yahtzee): Yahtzee {
    const { playerInTurn, scores, roll } = yahtzee
    if (registered(scores[playerInTurn], slot)) throw new Error("Cannot overwrite score")
    return {
      ...yahtzee,
      scores: update(playerInTurn, register_player(scores[playerInTurn], slot, roll), scores),
      playerInTurn: (playerInTurn + 1) % yahtzee.players.length,
      roll: yahtzee.roller.roll(5),
      rolls_left: 2
    }
}

export function scores(yahtzee: Omit<Yahtzee, 'roller'>): number[] {
  return yahtzee.scores.map(total)
}

export function is_finished(yahtzee: Omit<Yahtzee, 'roller'>): boolean {
  return yahtzee.scores.every(is_finished_player)
}
