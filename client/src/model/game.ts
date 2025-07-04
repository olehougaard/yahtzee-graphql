import type { YahtzeeSpecs } from "domain/src/model/yahtzee.game"
import type { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento"

export type IndexedYahtzee = Readonly<Omit<YahtzeeMemento, 'roller'> & { id: number, pending: false }>

export type IndexedYahtzeeSpecs = Readonly<YahtzeeSpecs & { id: number, pending: true }>