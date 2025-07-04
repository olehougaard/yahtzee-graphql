import { WebSocket } from "ws";
import { IndexedMemento, PendingGame, ServerError } from "./servermodel";
import { ServerModel } from "./servermodel"
import { SlotKey } from "domain/src/model/yahtzee.slots"
import { dice_roller } from "domain/src/model/dice";
import { standardRandomizer } from "domain/src/utils/random_utils";
import { MemoryStore } from "./memorystore";
import { ServerResponse } from "./response";

export interface Broadcaster {
  send: WebSocket['send']
}

const game0: IndexedMemento = {
  id: 0,
  players: ['Alice', 'Bob'],
  playerInTurn: 0,
  roll: [1, 2, 3, 2, 4],
  rolls_left: 2,
  scores:[
    {
      [1]: 3,
      [2]: undefined,
      [3]: undefined,
      [4]: 12,
      [5]: 15,
      [6]: 18,
      'pair': 12,
      'two pairs': 22,
      'three of a kind': 15,
      'four of a kind': 16,
      'full house': 27,
      'small straight': 0,
      'large straight': 20,
      'chance': 26,
      'yahtzee': 0
    },
    {
      [1]: 3,
      [2]: undefined,
      [3]: 12,
      [4]: 12,
      [5]: 20,
      [6]: 18,
      'pair': 10,
      'two pairs': 14,
      'three of a kind': 12,
      'four of a kind': 8,
      'full house': 18,
      'small straight': 0,
      'large straight': 0,
      'chance': 22,
      'yahtzee': undefined
    }
  ],
  pending: false
}

const server = new ServerModel(new MemoryStore(game0), standardRandomizer)

export default (broadcaster: Broadcaster) => {
  function new_game(creator: string, number_of_players: number): ServerResponse<IndexedMemento | PendingGame, ServerError> {
    const newGame = server.add(creator, number_of_players)
    newGame.process(broadcast)
    return newGame
  }
  
  function reroll(id: number, held: number[], player: string): ServerResponse<IndexedMemento, ServerError> {
    const game = server.reroll(id, held, player);
    game.process(broadcast)
    return game
  }
  
  function register(id: number, slot: SlotKey, player: string): ServerResponse<IndexedMemento, ServerError> {
    const game = server.register(id, slot, player);
    game.process(broadcast)
    return game
  }

  function games(): ServerResponse<IndexedMemento[], ServerError> {
    return server.all_games()
  }

  function game(id: number): ServerResponse<IndexedMemento, ServerError> {
    return server.game(id)
  }

  function pending_games(): ServerResponse<PendingGame[], ServerError> {
    return server.all_pending_games()
  }

  function pending_game(id: number): ServerResponse<PendingGame, ServerError> {
    return server.pending_game(id)
  }

  function join(id: number, player: string): ServerResponse<IndexedMemento | PendingGame, ServerError> {
    const game = server.join(id, player)
    game.process(broadcast)
    return game
  }
  
  function broadcast(game: IndexedMemento | PendingGame): void {
    broadcaster.send(JSON.stringify({type: 'send', message: game}))
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
