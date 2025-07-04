import { DiceRoller, DieValue } from "./dice"
import { is_finished as is_finished_player, total, PlayerScores } from "./yahtzee.score"

export interface YahtzeeMemento {
  players: string[],
  _scores: PlayerScores[],
  _playerInTurn: number,
  _roll: DieValue[],
  _rolls_left: number
}

export function scores(yahtzee: YahtzeeMemento): number[] {
  return yahtzee._scores.map(total)
}

export function is_finished(yahtzee: YahtzeeMemento): boolean {
  return yahtzee._scores.every(is_finished_player)
}
