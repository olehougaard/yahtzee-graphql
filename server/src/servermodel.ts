import { new_yahtzee, Yahtzee, YahtzeeSpecs } from "models/src/model/yahtzee.game";
import * as Game from "models/src/model/yahtzee.game";
import { SlotKey } from "models/src/model/yahtzee.slots";
import { Randomizer } from "models/src/utils/random_utils";
import { ServerResponse } from "./response";

export type IndexedGame = Yahtzee & { readonly id: number, readonly pending: false }

export type PendingGame = YahtzeeSpecs & {
  id: number,
  readonly pending: true
}

export type StoreError = { type: 'Not Found', key: any }

export type ServerError = { type: 'Forbidden' } | StoreError

const Forbidden: ServerError = { type: 'Forbidden' } as const

export interface GameStore {
  games(): ServerResponse<IndexedGame[], StoreError>
  game(id: number): ServerResponse<IndexedGame, StoreError>
  add(game: IndexedGame):  ServerResponse<IndexedGame, StoreError>
  update(game: IndexedGame):  ServerResponse<IndexedGame, StoreError>
  
  pending_games(): ServerResponse<PendingGame[], StoreError>
  pending_game(id: number): ServerResponse<PendingGame, StoreError>
  add_pending(specs: Partial<YahtzeeSpecs>): ServerResponse<PendingGame, StoreError>
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

  pending_game(id: number) {
    return this.store.pending_game(id)
  }

  add(creator: string, number_of_players: number) {
    return this.store.add_pending({creator, number_of_players})
      .flatMap(game => this.join(game.id, creator))
  }

  private startGameIfReady(pending_game: PendingGame): ServerResponse<IndexedGame | PendingGame, StoreError> {
    const id = pending_game.id
    if (pending_game.players.length === pending_game.number_of_players) {
      const game = new_yahtzee({players: pending_game.players, randomizer: this.randomizer})
      this.store.delete_pending(id)
      return this.store.add({...game, id, pending: false})
    } else {
      return this.store.update_pending(pending_game)
    }
  }

  join(id: number, player: string) {
    const pending_game = this.store.pending_game(id)
    pending_game.process(game => game.players.push(player))
    return pending_game.flatMap(this.startGameIfReady.bind(this))
  }

  reroll(id: number, held: number[], player: string): ServerResponse<IndexedGame, ServerError > {
    return this.game(id)
      .filter(game => game && game.players[game.playerInTurn] === player, _ => Forbidden)
      .flatMap(game => this.update(game.id, Game.reroll.bind(null, held)))
  }
  
  register(id: number, slot: SlotKey, player: string): ServerResponse<IndexedGame, ServerError> {
    return this.game(id)
      .filter(game => game && game.players[game.playerInTurn] === player, _ => Forbidden)
      .flatMap(game => this.update(game.id, Game.register.bind(null, slot)))
  }

  private update(id: number, updater: (g: Yahtzee) => Yahtzee) {
    return this.store.game(id)
      .flatMap(game => this.store.update({ ...updater(game), id, pending: game.pending }))
  }
}
