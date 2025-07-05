import { GameStore, IndexedYahtzee, PendingGame, StoreError } from "./servermodel"
import { ServerResponse } from "./response"

const not_found = (key: any): StoreError => ({ type: 'Not Found', key })

export class MemoryStore implements GameStore<string> {
  private _games: IndexedYahtzee<string>[]
  private _pending_games: PendingGame<string>[]
  private next_id: number = 1

  constructor(...games: IndexedYahtzee<string>[]) {
    this._games = [...games]
    this._pending_games = []
  }

  to_id(id: string) {
    return id
  }
  
  games() {
    return ServerResponse.ok([...this._games])
  }
  
  async game(id: string) {
    const found = await ServerResponse.ok(this._games.find(g => g.id === id))
    const game = await found.filter(async (g) => g !== undefined, async (_) => not_found(id))
    return game.map(async g => g!)
  }

  add(game: IndexedYahtzee<string>) {
    this._games.push(game)
    return ServerResponse.ok(game)
  }

  update(game: IndexedYahtzee<string>) {
    const index = this._games.findIndex(g => g.id === game.id)
    if (index === -1) {
      return ServerResponse.error(not_found(index))
    }
    this._games[index] = game
    return ServerResponse.ok(game)
  }

  pending_games() {
    return ServerResponse.ok([...this._pending_games])
  }

  async pending_game(id: string) {
    const found = await ServerResponse.ok(this._pending_games.find(g => g.id === id))
    const game = await found.filter(async (g) => g !== undefined, async (_) => not_found(id))
    return game.map(async g => g!)
  }

  add_pending(game: Omit<PendingGame<string>, 'id'>) {
    const id = this.next_id++;
    const pending_game: PendingGame<string> = { ...game, id: id.toString() }
    this._pending_games.push(pending_game)
    return ServerResponse.ok(pending_game)
  }

  async delete_pending(id: string): Promise<ServerResponse<null, StoreError>> {
    const index = this._pending_games.findIndex(g => g.id === id)
    if (index !== -1) {
      this._pending_games.splice(index, 1)
    }
    return ServerResponse.ok(null)
  }

  update_pending(pending: PendingGame<string>): Promise<ServerResponse<PendingGame<string>, StoreError>> {
    const index = this._pending_games.findIndex(g => g.id === pending.id)
    if (index === -1) {
      return ServerResponse.error(not_found(pending.id))
    }
    this._pending_games[index] = pending
    return ServerResponse.ok(pending)
  }
}