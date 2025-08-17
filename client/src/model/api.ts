import { ApolloClient, gql, InMemoryCache, type DocumentNode, split, HttpLink } from "@apollo/client/core";
import { type IndexedYahtzee, type IndexedYahtzeeSpecs, from_memento_indexed, from_graphql_game } from "./game";
import type { SlotKey } from "domain/src/model/yahtzee.slots";
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const headers = {Accept: 'application/json', 'Content-Type': 'application/json'}

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}));

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const apolloClient = new ApolloClient({
  link: splitLink,
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

export async function onGame(subscriber: (game: IndexedYahtzee) => any) {
  const gameSubscriptionQuery = gql`subscription GameSubscription {
    active {
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
  }`
  const gameObservable = apolloClient.subscribe({ query: gameSubscriptionQuery })
  gameObservable.subscribe({
    next({data}) {
      const game: IndexedYahtzee = from_graphql_game(data.active)
      subscriber(game)
    },
    error(err) {
      console.error(err)
    }
  })
}

export async function onPending(subscriber: (game: IndexedYahtzeeSpecs) => any) {
  const gameSubscriptionQuery = gql`subscription GameSubscription {
    pending {
      id
      pending
      creator
      players
      number_of_players
    }
  }`
  const gameObservable = apolloClient.subscribe({ query: gameSubscriptionQuery })
  gameObservable.subscribe({
    next({data}) {
      const pending: IndexedYahtzeeSpecs = data.pending
      subscriber(pending)
    },
    error(err) {
      console.error(err)
    }
  })
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
  return memento.games.map(from_graphql_game)
}

export async function pending_games(): Promise<IndexedYahtzeeSpecs[]> {
  const specs = await query(gql`{
    pending_games {
      id
      pending
      creator
      players
      number_of_players
    }
  }`)
  return specs.pending_games
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
  const game = response.new_game
  if (game.pending)
    return game as IndexedYahtzeeSpecs
  else
    return from_graphql_game(game)
}

export async function join(game: IndexedYahtzeeSpecs, player: string): Promise<IndexedYahtzeeSpecs|IndexedYahtzee> {
  const response = await mutate(gql`
    mutation Join($id: ID!, $player: String!) {
      join(id: $id, player: $player) {
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
  }`, { id: game.id, player })
  const joinedGame = response.join
  if (joinedGame.pending)
    return joinedGame as IndexedYahtzeeSpecs
  else
    return from_graphql_game(joinedGame)
}

async function perform_action(game: IndexedYahtzee, action: any) {
  return post(`http://localhost:8080/games/${game.id}/actions`, action)
}

export async function reroll(game: IndexedYahtzee, held: number[], player: string) {
  const response = await mutate(gql`
    mutation Reroll($id: ID!, $held: [Int!]!, $player: String!) {
      reroll(id: $id, held: $held, player: $player) {
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
    }`, { id: game.id, held, player })
  const joinedGame = response.reroll
  return from_graphql_game(joinedGame)
}

export async function register(game: IndexedYahtzee, slot: SlotKey, player: string) {
  return perform_action(game, { type: 'register', slot, player })
}
