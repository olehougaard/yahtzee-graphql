import { YahtzeeSpecs } from "models/src/model/yahtzee.game"
import { GameStore, IndexedGame, PendingGame } from "./servermodel"

export class MemoryStore implements GameStore {
  public _games: IndexedGame[]
  public _pending_games: PendingGame[]
  private next_id: number = 1

  constructor(...games: IndexedGame[]) {
    this._games = [...games]
    this._pending_games = []
  }
  
  games() {
    return [...this._games]
  }
  
  game(id: number) {
    const g = this._games.find(g => g.id === id)
    if (g === undefined) throw new Error('Not Found')
      return g
  }

  add(game: IndexedGame): IndexedGame {
    this._games.push(game)
    return game
  }

  update(game: IndexedGame) {
    const index = this._games.findIndex(g => g.id === game.id)
    if (index === -1) {
      throw new Error('Not Found')
    }
    this._games[index] = game
    return game
  }

  pending_games() {
    return [...this._pending_games]
  }

  pending_game(id: number) {
    const g = this._pending_games.find(g => g.id === id)
    if (g === undefined) throw new Error('Not Found')
      return g
  }

  add_pending({creator, number_of_players, players=[]}: Partial<YahtzeeSpecs>): PendingGame {
    const id = this.next_id++;
    const pending_game: PendingGame = { creator, number_of_players, id, players, pending: true }
    this._pending_games.push(pending_game)
    return pending_game
  }

  delete_pending(id: number) {
    const index = this._pending_games.findIndex(g => g.id === id)
    if (index !== -1) {
      this._pending_games.splice(index, 1)
    }
  }

  update_pending(pending: PendingGame) {
    const index = this._pending_games.findIndex(g => g.id === pending.id)
    if (index === -1) {
      throw new Error('Not Found')
    }
    this._pending_games[index] = pending
    return pending
  }
}