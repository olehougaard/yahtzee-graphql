import { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento";
import { Randomizer } from "domain/src/utils/random_utils";
import { IndexedYahtzee } from "./servermodel";
import * as Game from "domain/src/model/yahtzee.game";
import { dice_roller } from "domain/src/model/dice";

export type IndexedMemento<IdType> = YahtzeeMemento & { readonly id: IdType, readonly pending: false }

export function from_memento<IdType>(m: IndexedMemento<IdType>, randomizer: Randomizer): IndexedYahtzee<IdType> {
  return {
    ...Game.from_memento(m, dice_roller(randomizer)),
    id: m.id,
    pending: false
  }
}

export function to_memento<IdType>(y: IndexedYahtzee<IdType>): IndexedMemento<IdType> {
  return {
    ...y.to_memento(),
    id: y.id,
    pending: y.pending
  }
}

