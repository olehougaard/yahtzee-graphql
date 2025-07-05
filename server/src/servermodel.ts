import { YahtzeeSpecs } from "domain/src/model/yahtzee.game";
import * as Game from "domain/src/model/yahtzee.game";
import { SlotKey } from "domain/src/model/yahtzee.slots";
import { Randomizer } from "domain/src/utils/random_utils";
import { ServerResponse } from "./response";

export interface IndexedYahtzee<IdClass> extends Game.Yahtzee {
  readonly id: IdClass
  readonly pending: false
}

export type PendingGame<IdClass> = YahtzeeSpecs & {
  id: IdClass,
  readonly pending: true
}

export type StoreError = { type: 'Not Found', key: any } | { type: 'DB Error', error: any }

export type ServerError = { type: 'Forbidden' } | StoreError

const Forbidden: ServerError = { type: 'Forbidden' } as const

export interface GameStore<IdClass> {
  to_id(id: String): IdClass

  games(): Promise<ServerResponse<IndexedYahtzee<IdClass>[], StoreError>>
  game(id: IdClass): Promise<ServerResponse<IndexedYahtzee<IdClass>, StoreError>>
  add(game: IndexedYahtzee<IdClass>):  Promise<ServerResponse<IndexedYahtzee<IdClass>, StoreError>>
  update(game: IndexedYahtzee<IdClass>):  Promise<ServerResponse<IndexedYahtzee<IdClass>, StoreError>>
  
  pending_games(): Promise<ServerResponse<PendingGame<IdClass>[], StoreError>>
  pending_game(id: IdClass): Promise<ServerResponse<PendingGame<IdClass>, StoreError>>
  add_pending(game: Omit<PendingGame<IdClass>, 'id'>): Promise<ServerResponse<PendingGame<IdClass>, StoreError>>
  delete_pending(id: IdClass): Promise<ServerResponse<null, StoreError>>
  update_pending(pending: PendingGame<IdClass>): Promise<ServerResponse<PendingGame<IdClass>, StoreError>>
}

export class ServerModel<IdClass> {
  private store: GameStore<IdClass>
  private randomizer: Randomizer

  constructor(store: GameStore<IdClass>, randomizer: Randomizer) {
    this.store = store
    this.randomizer = randomizer
  }

  all_games() {
    return this.store.games()
  }

  all_pending_games() {
   return this.store.pending_games()
  }

  game(id: IdClass) {
    return this.store.game(id)
  }

  pending_game(id: IdClass) {
    return this.store.pending_game(id)
  }

  async add(creator: string, number_of_players: number) {
    const g = await this.store.add_pending({ creator, number_of_players, players: [], pending: true });
    return g.flatMap(game_1 => this.join(game_1.id, creator));
  }

  private startGameIfReady(pending_game: PendingGame<IdClass>): Promise<ServerResponse<IndexedYahtzee<IdClass> | PendingGame<IdClass>, StoreError>> {
    const id = pending_game.id
    if (pending_game.players.length === pending_game.number_of_players) {
      const game = Game.new_yahtzee({players: pending_game.players, randomizer: this.randomizer})
      this.store.delete_pending(id)
      return this.store.add({...game, id, pending: false})
    } else {
      return this.store.update_pending(pending_game)
    }
  }

  async join(id: IdClass, player: string) {
    const pending_game = await this.store.pending_game(id)
    pending_game.process(async game => game.players.push(player))
    return pending_game.flatMap(g => this.startGameIfReady(g))
  }

  reroll(id: IdClass, held: number[], player: string): Promise<ServerResponse<IndexedYahtzee<IdClass>, ServerError>> {
    return this.update(id, player, async game => game.reroll(held))
  }
  
  register(id: IdClass, slot: SlotKey, player: string): Promise<ServerResponse<IndexedYahtzee<IdClass>, ServerError>> {
    return this.update(id, player, async game => game.register(slot))
  }
  
  private async update(id: IdClass, player: string, processor: (game: IndexedYahtzee<IdClass>) => Promise<unknown>)
      : Promise<ServerResponse<IndexedYahtzee<IdClass>, ServerError>> {
    let yahtzee: ServerResponse<IndexedYahtzee<IdClass>, ServerError> = await this.game(id)
    yahtzee = await yahtzee.filter(async game => game && game.playerInTurn() === player, async _ => Forbidden)
    yahtzee.process(processor)
    return yahtzee.flatMap(async game => this.store.update(game));
  }
}
