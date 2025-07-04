import { WebSocket } from "ws";
import { IndexedGame, PendingGame, ServerError } from "./servermodel";
import { ServerModel } from "./servermodel"
import { SlotKey } from "models/src/model/yahtzee.slots"
import { dice_roller } from "models/src/model/dice";
import { standardRandomizer } from "models/src/utils/random_utils";
import { MemoryStore } from "./memorystore";
import { ServerResponse } from "./response";

export interface Broadcaster {
  send: WebSocket['send']
}

const game0: IndexedGame = {
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
  pending: false,
  roller: dice_roller(standardRandomizer)
};

const server = new ServerModel(new MemoryStore(game0), standardRandomizer)

export default (broadcaster: Broadcaster) => {
  function new_game(creator: string, number_of_players: number): ServerResponse<IndexedGame | PendingGame, ServerError> {
    return server.add(creator, number_of_players)
  }
  
  function reroll(id: number, held: number[], player: string): ServerResponse<IndexedGame, ServerError> {
    return server.reroll(id, held, player)
  }
  
  function register(id: number, slot: SlotKey, player: string): ServerResponse<IndexedGame, ServerError> {
    return server.register(id, slot, player)
  }

  function games(): ServerResponse<IndexedGame[], ServerError> {
    return server.all_games()
  }

  function pending_games(): ServerResponse<PendingGame[], ServerError> {
    return server.all_pending_games()
  }

  function join(id: number, player: string): ServerResponse<IndexedGame | PendingGame, ServerError> {
    return server.join(id, player)
  }
  
  function broadcast(game: IndexedGame | PendingGame): void {
    broadcaster.send(JSON.stringify({type: 'send', message: game}))
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
