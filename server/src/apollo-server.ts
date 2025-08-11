import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import express from 'express';
import bodyParser from 'body-parser'
import http from 'http';
import {promises as fs} from "fs"
import { WebSocket } from 'ws'

import { GameStore, IndexedYahtzee, PendingGame, StoreError } from './servermodel';
import { from_memento, IndexedMemento, to_memento } from './memento';
import { standardRandomizer } from 'domain/src/utils/random_utils';
import create_api from './api'
import { MongoStore } from './mongostore';
import { MemoryStore } from './memorystore';
import { GraphQLError } from 'graphql';
import { slot_keys } from 'domain/src/model/yahtzee.slots';
import { PlayerScoresMemento, slot_score } from 'domain/src/model/yahtzee.score.memento';
import cors from 'cors';

const game0: IndexedMemento = {
  id: '0',
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

async function toMemento(game: PendingGame | IndexedYahtzee): Promise<IndexedMemento | PendingGame> {
  if (game.pending)
    return game
  else
    return to_memento(game)
}

function create_scores(memento: PlayerScoresMemento) {
  return slot_keys.map(k => ({ slot: k.toString(), score: slot_score(memento, k) }))
}

function toGraphQLGame(game: IndexedYahtzee) {
  const memento = to_memento(game)
  return {
    id: memento.id,
    pending: false,
    players: memento.players,
    playerInTurn: memento.playerInTurn,
    roll: memento.roll,
    rolls_left: memento.rolls_left,
    scores: memento.scores.map(create_scores),
  }
}

async function startServer(ws: WebSocket, store: GameStore) {
  const broadcaster = {
    async send(game: PendingGame | IndexedYahtzee) {
      const message = await toMemento(game)
      ws.send(JSON.stringify({type: 'send', message}))
    }
  }

  async function respond_with_error(err: StoreError): Promise<never> {
    throw new GraphQLError(err.type)
  }

  const randomizer = standardRandomizer
  const api = create_api(broadcaster, store, randomizer)
    try {
        const content = await fs.readFile('./yahtzee.sdl', 'utf8')
        const typeDefs = `#graphql
          ${content}`
        const resolvers = {
          Query: {
            games: async () => {
              const res = await api.games()
              return res.resolve({
                onSuccess: async gs => gs.map(toGraphQLGame),
                onError: respond_with_error
              })
            }
          },
          Mutation: {
            new_game: async (_:any, {creator, number_of_players}: {creator: string, number_of_players: number}) => {
              const res = await api.new_game(creator, number_of_players)
              return res.resolve({
                onSuccess: async game => {
                  if (game.pending)
                    return game
                  else
                    return toGraphQLGame(game)
                },
                onError: respond_with_error
              })
            }
          },
          Game: {
            __resolveType(obj:any) {
              if (obj.pending)
                return 'PendingGame'
              else
                return 'ActiveGame'
            }
          }
        }

        const app = express()
        app.use('/graphql', bodyParser.json())

        app.use(cors())
        app.use('/graphql', (_, res, next) => {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "*");
          res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          next();
        })
        
        const httpServer = http.createServer(app)

        const server = new ApolloServer({
          typeDefs,
          resolvers,
          plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        })
        await server.start()
        app.use('/graphql', expressMiddleware(server))
        
        httpServer.listen({ port: 4000 }, () => console.log(`GraphQL server ready on http://localhost:4000/graphql`))
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

function configAndStart(ws: WebSocket) {
  const mongoIndex = process.argv.indexOf('--mongodb')
  if (mongoIndex !== -1) {
    const connectionString = process.argv[mongoIndex + 1]
    if (!connectionString)
      throw new Error('--mongodb needs connection string')
    const dbNameIndex = process.argv.indexOf('--dbname')
    const dbName = dbNameIndex !== -1? process.argv[dbNameIndex + 1] : 'test'
    startServer(ws, MongoStore(connectionString, dbName, standardRandomizer))
  } else
    startServer(ws, new MemoryStore(from_memento(game0, standardRandomizer)))
}

const ws = new WebSocket('ws://localhost:9090/publish')
ws.onopen = e => configAndStart(e.target)
