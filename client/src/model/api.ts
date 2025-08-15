import { ApolloClient, gql, InMemoryCache, type DocumentNode } from "@apollo/client/core";
import { type IndexedYahtzee, type IndexedYahtzeeSpecs, type IndexedYahtzeeMemento, from_memento_indexed, from_graphql_game } from "./game";
import type { SlotKey } from "domain/src/model/yahtzee.slots";

const uri = 'http://localhost:4000/graphql'

const headers = {Accept: 'application/json', 'Content-Type': 'application/json'}

const apolloClient = new ApolloClient({
  uri,
  cache: new InMemoryCache()
})

async function post(url: string, body: {} = {}): Promise<any> {
  const response: Response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body)})
  if (!response.ok) return Promise.reject(response)
  return await response.json()
}

async function query(query: DocumentNode, variables?: Object): Promise<any> {
  const { data } = await apolloClient.query({ query, variables, fetchPolicy: 'network-only' })    
  return data
}  

async function mutate(mutation: DocumentNode, variables?: Object): Promise<any> {
  const { data } = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'network-only' })    
  return data
}  

export async function games(): Promise<IndexedYahtzee[]> {
  const memento = await query(gql`{
    games {
      id
      players
      playerInTurn
      roll
      rolls_left
      scores {
        score
        slot
      }
    }
  }`)
  console.log(memento.games)
  return memento.games.map(from_graphql_game)
}

export async function pending_games(): Promise<IndexedYahtzeeSpecs[]> {
  const response = await fetch('http://localhost:8080/pending-games', { headers })
  return await response.json()
}

export async function join(game: IndexedYahtzeeSpecs, player: string) {
  return post(`http://localhost:8080/pending-games/${game.id}/players`, {player})
}

export async function new_game(number_of_players: number, player: string): Promise<IndexedYahtzeeSpecs|IndexedYahtzee> {
  const response = await mutate(gql`
    mutation NewGame($creator: String!, $numberOfPlayers: Int!) {
      new_game(creator: $creator, number_of_players: $numberOfPlayers) {
      ... on PendingGame {
        id
        number_of_players
        pending
        creator
        players
      }
      ... on ActiveGame {
        id
        pending
        players
        playerInTurn
        roll
        rolls_left
        scores {
          slot
          score
        }
      }    
    }
  }`, { creator: player, numberOfPlayers: number_of_players })
  const game: IndexedYahtzeeSpecs|IndexedYahtzeeMemento = response.new_game
  console.log(game)
  if (game.pending)
    return game
  else
    return from_memento_indexed(game)
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
