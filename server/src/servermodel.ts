import { YahtzeeSpecs } from "domain/src/model/yahtzee.game";
import * as Game from "domain/src/model/yahtzee.game";
import { SlotKey } from "domain/src/model/yahtzee.slots";
import { Randomizer } from "domain/src/utils/random_utils";
import { ServerResponse } from "./response";
import { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento";

export type IndexedMemento = YahtzeeMemento & { readonly id: number, readonly pending: false }

export interface IndexedYahtzee extends Game.Yahtzee {
  readonly id: number
  readonly pending: false
}

function from_memento(m: IndexedMemento): IndexedYahtzee {
  return {
    ...Game.from_memento(m),
    id: m.id,
    pending: false
  }
}

function to_memento(y: IndexedYahtzee): IndexedMemento {
  return {
    ...y.to_memento(),
    id: y.id,
    pending: y.pending
  }
}

export type PendingGame = YahtzeeSpecs & {
  id: number,
  readonly pending: true
}

export type StoreError = { type: 'Not Found', key: any }

export type ServerError = { type: 'Forbidden' } | StoreError

const Forbidden: ServerError = { type: 'Forbidden' } as const

export interface GameStore {
  games(): ServerResponse<IndexedMemento[], StoreError>
  game(id: number): ServerResponse<IndexedMemento, StoreError>
  add(game: IndexedMemento):  ServerResponse<IndexedMemento, StoreError>
  update(game: IndexedMemento):  ServerResponse<IndexedMemento, StoreError>
  
  pending_games(): ServerResponse<PendingGame[], StoreError>
  pending_game(id: number): ServerResponse<PendingGame, StoreError>
  add_pending(game: Omit<PendingGame, 'id'>): ServerResponse<PendingGame, StoreError>
  delete_pending(id: number): void
  update_pending(pending: PendingGame): ServerResponse<PendingGame, StoreError>
}

export class ServerModel {
  private store: GameStore
  private randomizer: Randomizer

  constructor(store: GameStore, randomizer: Randomizer) {
    this.store = store
    this.randomizer = randomizer
  }

  all_games() {
    return this.store.games()
  }

  all_pending_games() {
   return this.store.pending_games()
  }

  game(id: number) {
    return this.store.game(id)
  }

  private load_yahtzee(id: number): ServerResponse<IndexedYahtzee, StoreError> {
    return this.game(id).map(from_memento)
  }

  pending_game(id: number) {
    return this.store.pending_game(id)
  }

  add(creator: string, number_of_players: number) {
    return this.store.add_pending({creator, number_of_players, players: [], pending: true})
      .flatMap(game => this.join(game.id, creator))
  }

  private startGameIfReady(pending_game: PendingGame): ServerResponse<IndexedMemento | PendingGame, StoreError> {
    const id = pending_game.id
    if (pending_game.players.length === pending_game.number_of_players) {
      const game = Game.new_yahtzee({players: pending_game.players, randomizer: this.randomizer})
      this.store.delete_pending(id)
      return this.store.add(to_memento({...game, id, pending: false}))
    } else {
      return this.store.update_pending(pending_game)
    }
  }

  join(id: number, player: string) {
    const pending_game = this.store.pending_game(id)
    pending_game.process(game => game.players.push(player))
    return pending_game.flatMap(this.startGameIfReady.bind(this))
  }

  reroll(id: number, held: number[], player: string): ServerResponse<IndexedMemento, ServerError> {
    return this.update(id, player, game => game.reroll(held))
  }
  
  register(id: number, slot: SlotKey, player: string): ServerResponse<IndexedMemento, ServerError> {
    return this.update(id, player, game => game.register(slot))
  }
  
  private update(id: number, player: string, processor: (game: IndexedYahtzee) => void): ServerResponse<IndexedMemento, ServerError> {
    const yahtzee = this.load_yahtzee(id)
      .filter(game => game && game.playerInTurn() === player, _ => Forbidden)
    yahtzee.process(processor)
    return yahtzee.flatMap(game => this.store.update(to_memento(game)))
  }
}
