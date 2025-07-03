import { WebSocket } from "ws";
import * as Game from "models/src/model/yahtzee.game"
import { IndexedGame, PendingGame } from "./servermodel";
import * as G from "./servermodel"
import { SlotKey } from "models/src/model/yahtzee.slots"

export default (ws: WebSocket) => {
  function new_game(creator: string, number_of_players: number): IndexedGame | PendingGame {
    return G.add(creator, number_of_players)
  }
  
  function reroll(id: number, held: number[], player: string) {
    const game = G.game(id)
    if (!game || player !== game.players[game.playerInTurn])
      throw new Error('Forbidden')
    return G.update(id, game => Game.reroll(held, game))
  }
  
  function register(id: number, slot: SlotKey, player: string) {
    const game = G.game(id)
    if (!game || player !== game.players[game.playerInTurn])
      throw new Error('Forbidden')
    return G.update(id, game => Game.register(slot, game))
  }

  function games(): Readonly<IndexedGame[]> {
    return G.all_games()
  }

  function pending_games(): Readonly<PendingGame[]> {
    return G.all_pending_games()
  }

  function join(id: number, player: string): IndexedGame | PendingGame {
    return G.join(id, player)
  }
  
  function broadcast(game: IndexedGame | PendingGame): void {
    ws.send(JSON.stringify({type: 'send', message: game}))
  }

  return {
    new_game,
    pending_games,
    join,
    games,
    reroll,
    register,
    broadcast,
  }
}
