import { dice_roller } from "models/src/model/dice";
import { new_yahtzee, Yahtzee, YahtzeeSpecs } from "models/src/model/yahtzee.game";
import { standardRandomizer } from "models/src/utils/random_utils";

export type IndexedGame = Yahtzee & { readonly id: number, readonly pending: false }

let global_id = 1

const game0: IndexedGame = {
  id: 0,
  players: ['Alice', 'Bob'],
  playerInTurn: 0,
  roll: [1, 2, 3, 2, 4],
  rolls_left: 2,
  scores:[
    {
      upper_section: {
        scores: {
          [1]: 3,
          [2]: undefined,
          [3]: undefined,
          [4]: 12,
          [5]: 15,
          [6]: 18
        }
      },
      lower_section: {
        scores: {
          'pair': 12,
          'two pairs': 22,
          'three of a kind': 15,
          'four of a kind': 16,
          'full house': 27,
          'small straight': 0,
          'large straight': 20,
          'chance': 26,
          'yahtzee': 0
        }
      }
    },
    {
      upper_section:{
        scores: {
          [1]: 3,
          [2]: undefined,
          [3]: 12,
          [4]: 12,
          [5]: 20,
          [6]: 18
        }
      },
      lower_section: {
      scores: {
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
    }
    }
  ],
  pending: false,
  roller: dice_roller(standardRandomizer)
};
const games: IndexedGame[] = [game0]

export type PendingGame = YahtzeeSpecs & {
  id: number,
  readonly pending: true
}

const pending_games: PendingGame[] = []

export function all_games(): Readonly<IndexedGame[]> {
  return games
}

export function all_pending_games(): Readonly<PendingGame[]> {
  return pending_games
}

export function game(id: number): IndexedGame | undefined {
  return games.find(g => g.id === id)
}

export function add(creator: string, number_of_players: number): PendingGame | IndexedGame {
  const id = global_id++
  const pending_game: PendingGame = { id, creator, players: [], number_of_players, pending: true }
  pending_games.push(pending_game)
  return join(id, creator)
}

export function join(id: number, player: string): PendingGame | IndexedGame {
  const index = pending_games.findIndex(g => g.id === id)
  if (index === -1)
    throw new Error('Not found')
  const pending_game = pending_games[index]
  pending_game.players.push(player)
  if (pending_game.players.length === pending_game.number_of_players) {
    const game = new_yahtzee({players: pending_game.players, randomizer: standardRandomizer})
    pending_games.splice(index, 1)
    games.push({...game, id, pending: false})
    return { ...game, id, pending: false }
  } else {
    return pending_game
  }
}

export function update(id: number, reroll: (g: Yahtzee) => Yahtzee) {
  const index = games.findIndex(g => g.id === id)
  if (index === -1) 
    throw new Error('Not found')
  games[index] = { ...reroll(games[index]), id, pending: games[index].pending }
  return games[index]
}
