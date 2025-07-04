import { die_values } from "./dice";
import { new_scores_memento, PlayerScoresMemento, registered, slot_keys, total } from "./yahtzee.score.memento";
import { Roll, SlotKey, slots } from "./yahtzee.slots";

export interface PlayerScores {
  to_memento(): PlayerScoresMemento

  register(key: SlotKey, roll: Roll): void

  score(key: SlotKey): number | undefined
  sum(): number
  bonus(): number
  total(): number

  is_finished(): boolean
}

export function new_scores(): PlayerScores {
  return from_memento(new_scores_memento())
}

export function from_memento(memento: PlayerScoresMemento): PlayerScores {
  const scores = {...memento}

  function register(key: SlotKey, roll: Roll) {
    if (registered(scores, key))
      throw new Error("Cannot overwrite score")
    scores[key] = slots[key].score(roll)
  }

  function score(key: SlotKey) {
     return scores[key]
  }

  function sum() {
    return die_values
      .map(key => score(key) ?? 0)
      .reduce((s, v) => s + v, 0)
  }

  function bonus() {
    return sum() >= 63? 50 : 0
  }

  function is_finished() {
    return slot_keys.map(score).every(s => s !== undefined)
  }

  return {
    to_memento: () => scores,
    register,
    score,
    sum,
    bonus,
    total: () => total(scores),
    is_finished,
  }
}
