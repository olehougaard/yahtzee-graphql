import { GameStore, IndexedYahtzee, PendingGame, ServerError } from "./servermodel";
import { ServerModel } from "./servermodel"
import { SlotKey } from "domain/src/model/yahtzee.slots"
import { Randomizer } from "domain/src/utils/random_utils";

export interface Broadcaster<IdClass> {
  send: (message: IndexedYahtzee<IdClass> | PendingGame<IdClass>) => Promise<void>
}

export default <IdClass>(broadcaster: Broadcaster<IdClass>, store: GameStore<IdClass>, randomizer: Randomizer) => {
  const server = new ServerModel(store, randomizer)

  async function new_game(creator: string, number_of_players: number) {
    const newGame = await server.add(creator, number_of_players)
    newGame.process(broadcast)
    return newGame
  }
  
  async function reroll(id: IdClass, held: number[], player: string) {
    const game = await server.reroll(id, held, player);
    game.process(broadcast)
    return game
  }
  
  async function register(id: IdClass, slot: SlotKey, player: string) {
    const game = await server.register(id, slot, player);
    game.process(broadcast)
    return game
  }

  async function games() {
    return server.all_games()
  }

  async function game(id: IdClass) {
    return server.game(id)
  }

  function pending_games() {
    return server.all_pending_games()
  }

  function pending_game(id: IdClass) {
    return server.pending_game(id)
  }

  async function join(id: IdClass, player: string) {
    const game = await server.join(id, player)
    game.process(broadcast)
    return game
  }
  
  async function broadcast(game: IndexedYahtzee<IdClass> | PendingGame<IdClass>): Promise<void> {
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
