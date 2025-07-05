import { GameStore, IndexedYahtzee, PendingGame } from "./servermodel";
import { ServerModel } from "./servermodel"
import { SlotKey } from "domain/src/model/yahtzee.slots"
import { Randomizer } from "domain/src/utils/random_utils";

export interface Broadcaster {
  send: (message: IndexedYahtzee | PendingGame) => Promise<void>
}

export default (broadcaster: Broadcaster, store: GameStore, randomizer: Randomizer) => {
  const server = new ServerModel(store, randomizer)

  async function new_game(creator: string, number_of_players: number) {
    const newGame = await server.add(creator, number_of_players)
    newGame.process(broadcast)
    return newGame
  }
  
  async function reroll(id: string, held: number[], player: string) {
    const game = await server.reroll(id, held, player);
    game.process(broadcast)
    return game
  }
  
  async function register(id: string, slot: SlotKey, player: string) {
    const game = await server.register(id, slot, player);
    game.process(broadcast)
    return game
  }

  async function games() {
    return server.all_games()
  }

  async function game(id: string) {
    return server.game(id)
  }

  function pending_games() {
    return server.all_pending_games()
  }

  function pending_game(id: string) {
    return server.pending_game(id)
  }

  async function join(id: string, player: string) {
    const game = await server.join(id, player)
    game.process(broadcast)
    return game
  }
  
  async function broadcast(game: IndexedYahtzee | PendingGame): Promise<void> {
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
