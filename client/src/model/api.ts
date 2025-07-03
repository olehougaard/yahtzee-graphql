import type { IndexedYahtzee, IndexedYahtzeeSpecs } from "./game";
import type { SlotKey } from "models/src/model/yahtzee.slots";

const headers = {Accept: 'application/json', 'Content-Type': 'application/json'}

async function post(url: string, body: {} = {}): Promise<any> {
  const response: Response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body)})
  if (!response.ok) return Promise.reject(response)
  return await response.json()
}

export async function games(): Promise<IndexedYahtzee[]> {
  const response = await fetch('http://localhost:8080/games', { headers })
  return await response.json()
}

export async function pending_games(): Promise<IndexedYahtzeeSpecs[]> {
  const response = await fetch('http://localhost:8080/pending-games', { headers })
  return await response.json()
}

export async function join(game: IndexedYahtzeeSpecs, player: string) {
  return post(`http://localhost:8080/pending-games/${game.id}/players`, {player})
}

export async function new_game(number_of_players: number, player: string): Promise<IndexedYahtzeeSpecs|IndexedYahtzee> {
  return await post('http://localhost:8080/pending-games', { creator: player, number_of_players })
}

async function perform_action(game: IndexedYahtzee, action: any) {
  return post(`http://localhost:8080/games/${game.id}/actions`, action)
}

export async function reroll(game: IndexedYahtzee, held: number[], player: string) {
  return perform_action(game, { type: 'reroll', held, player })
}

export async function register(game: IndexedYahtzee, slot: SlotKey, player: string) {
  return perform_action(game, { type: 'register', slot, player })
}
