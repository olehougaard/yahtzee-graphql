import { new_yahtzee, Yahtzee, YahtzeeSpecs } from "models/src/model/yahtzee.game";
import * as Game from "models/src/model/yahtzee.game";
import { SlotKey } from "models/src/model/yahtzee.slots";
import { Randomizer } from "models/src/utils/random_utils";

export type IndexedGame = Yahtzee & { readonly id: number, readonly pending: false }

export type PendingGame = YahtzeeSpecs & {
  id: number,
  readonly pending: true
}


export interface GameStore {
  _games: IndexedGame[]
  _pending_games: PendingGame[]

  games(): IndexedGame[]
  game(id: number): IndexedGame
  add(game: IndexedGame): IndexedGame
  update(game: IndexedGame): IndexedGame

  pending_games(): PendingGame[]
  pending_game(id: number): PendingGame
  add_pending(specs: Partial<YahtzeeSpecs>): PendingGame
  delete_pending(id: number): void
  update_pending(pending: PendingGame): PendingGame
}

export class ServerModel {
  private store: GameStore
  private randomizer: Randomizer

  constructor(store: GameStore, randomizer: Randomizer) {
    this.store = store
    this.randomizer = randomizer
  }

  all_games(): Readonly<IndexedGame[]> {
    return this.store.games()
  }

  all_pending_games(): Readonly<PendingGame[]> {
   return this.store.pending_games()
  }

  game(id: number): IndexedGame | undefined {
    return this.store.game(id)
  }

  add(creator: string, number_of_players: number): PendingGame | IndexedGame {
    const game = this.store.add_pending({creator, number_of_players})
    return this.join(game.id, creator)
  }

  join(id: number, player: string): PendingGame | IndexedGame {
    const pending_game = this.store.pending_game(id)
    pending_game.players.push(player)
    if (pending_game.players.length === pending_game.number_of_players) {
      const game = new_yahtzee({players: pending_game.players, randomizer: this.randomizer})
      this.store.delete_pending(id)
      return this.store.add({...game, id, pending: false})
    } else {
      return this.store.update_pending(pending_game)
    }
  }

  reroll(id: number, held: number[], player: string) {
    const game = this.game(id)
    if (!game || player !== game.players[game.playerInTurn])
      throw new Error('Forbidden')
    return this.update(id, game => Game.reroll(held, game))
  }
  
  register(id: number, slot: SlotKey, player: string) {
    const game = this.game(id)
    if (!game || player !== game.players[game.playerInTurn])
      throw new Error('Forbidden')
    return this.update(id, game => Game.register(slot, game))
  }

  private update(id: number, updater: (g: Yahtzee) => Yahtzee) {
    const game = this.store.game(id)
    return this.store.update({ ...updater(game), id, pending: game.pending })
  }
}
