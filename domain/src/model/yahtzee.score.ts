import { new_scores_memento, PlayerScoresMemento, registered, total } from "./yahtzee.score.memento";
import { Roll, SlotKey, slots } from "./yahtzee.slots";

export interface PlayerScores {
  to_memento(): PlayerScoresMemento

  register(key: SlotKey, roll: Roll): void

  total(): number
}

export function new_memento(): PlayerScores {
  return from_score_memento(new_scores_memento())
}

export function from_score_memento(_memento: PlayerScoresMemento): PlayerScores {
  const memento = {..._memento}
  function register(key: SlotKey, roll: Roll) {
    if (registered(memento, key))
      throw new Error("Cannot overwrite score")
    memento[key] = slots[key].score(roll)
  }

  return {
    to_memento: () => memento,
    register,
    total: () => total(memento)
  }
}
