import { DieValue } from "./dice"
import { is_finished as is_finished_player, total, PlayerScoresMemento } from "./yahtzee.score.memento"

export interface YahtzeeMemento {
  readonly players: Readonly<string[]>,
  readonly scores: Readonly<PlayerScoresMemento[]>,
  readonly playerInTurn: number,
  readonly roll: Readonly<DieValue[]>,
  readonly rolls_left: number
}

export function scores(yahtzee: YahtzeeMemento): number[] {
  return yahtzee.scores.map(total)
}

export function is_finished(yahtzee: YahtzeeMemento): boolean {
  return yahtzee.scores.every(is_finished_player)
}
