import { from_memento, type Yahtzee, type YahtzeeSpecs } from "domain/src/model/yahtzee.game"
import type { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento"

type Indexed<Y, pending extends boolean> = Readonly<Y & {id: string, pending: pending}>

export type IndexedYahtzee = Indexed<Yahtzee, false>

export type IndexedYahtzeeMemento = Indexed<YahtzeeMemento, false>

export type IndexedYahtzeeSpecs = Indexed<YahtzeeSpecs, true>

export function from_memento_indexed(m: IndexedYahtzeeMemento): IndexedYahtzee {
  return {...from_memento(m), id: m.id, pending: m.pending}
}

