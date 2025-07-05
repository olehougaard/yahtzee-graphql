import { WebSocket } from "ws";
import { GameStore, IndexedYahtzee, PendingGame, ServerError } from "./servermodel";
import { ServerModel } from "./servermodel"
import { SlotKey } from "domain/src/model/yahtzee.slots"
import { dice_roller } from "domain/src/model/dice";
import { Randomizer, standardRandomizer } from "domain/src/utils/random_utils";
import { MemoryStore } from "./memorystore";
import { ServerResponse } from "./response";
import { YahtzeeMemento } from "domain/src/model/yahtzee.game.memento";

export interface Broadcaster {
  send: (message: IndexedYahtzee | PendingGame) => void
}

export default (broadcaster: Broadcaster, store: GameStore, randomizer: Randomizer) => {
  const server = new ServerModel(store, randomizer)

  function new_game(creator: string, number_of_players: number): ServerResponse<IndexedYahtzee | PendingGame, ServerError> {
    const newGame = server.add(creator, number_of_players)
    newGame.process(broadcast)
    return newGame
  }
  
  function reroll(id: number, held: number[], player: string): ServerResponse<IndexedYahtzee, ServerError> {
    const game = server.reroll(id, held, player);
    game.process(broadcast)
    return game
  }
  
  function register(id: number, slot: SlotKey, player: string): ServerResponse<IndexedYahtzee, ServerError> {
    const game = server.register(id, slot, player);
    game.process(broadcast)
    return game
  }

  function games(): ServerResponse<IndexedYahtzee[], ServerError> {
    return server.all_games()
  }

  function game(id: number): ServerResponse<IndexedYahtzee, ServerError> {
    return server.game(id)
  }

  function pending_games(): ServerResponse<PendingGame[], ServerError> {
    return server.all_pending_games()
  }

  function pending_game(id: number): ServerResponse<PendingGame, ServerError> {
    return server.pending_game(id)
  }

  function join(id: number, player: string): ServerResponse<IndexedYahtzee | PendingGame, ServerError> {
    const game = server.join(id, player)
    game.process(broadcast)
    return game
  }
  
  function broadcast(game: IndexedYahtzee | PendingGame): void {
    broadcaster.send(game)
  }

  return {
    new_game,
    pending_games,
    pending_game,
    join,
    games,
    game,
    reroll,
    register,
  }
}
