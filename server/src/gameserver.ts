import express, { type Express, type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import create_api from './api'
import { GameStore, IndexedYahtzee, PendingGame, ServerError } from './servermodel'
import { WebSocket } from 'ws'
import { SlotKey } from 'domain/src/model/yahtzee.slots'
import { ServerResponse } from './response'
import { from_memento, IndexedMemento, to_memento } from './memento'
import { MemoryStore } from './memorystore'
import { standardRandomizer } from 'domain/src/utils/random_utils'
import { MongoStore } from './mongostore'

const game0: IndexedMemento<string> = {
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

interface TypedRequest<BodyType> extends Request {
  body: BodyType
}

type RawAction = { type: 'reroll', held: number[] } 
               | { type: 'register', slot: SlotKey }

type Action = RawAction & { player: string }

async function send<T>(res: Response<T>, response: ServerResponse<T, ServerError>) {
  response.process(async value => res.send(value))
  response.processError(async e => {
    console.error(e)
    switch(e.type) {
      case 'Not Found': 
        res.sendStatus(404)
        break
      case 'Forbidden':
        res.sendStatus(403)
        break
      case 'DB Error':
        res.status(500).send(e.error)
        break
    }
  })
}

async function toMemento<IdClass>(game: PendingGame<IdClass> | IndexedYahtzee<IdClass>): Promise<IndexedMemento<IdClass> | PendingGame<IdClass>> {
  if (game.pending)
    return game
  else
    return to_memento(game)
  }

function start_server<IdClass>(ws: WebSocket, store: GameStore<IdClass>) {
  const broadcaster = {
    async send(game: PendingGame<IdClass> | IndexedYahtzee<IdClass>) {
      const message = await toMemento(game)
      ws.send(JSON.stringify({type: 'send', message}))
    }
  }

  const randomizer = standardRandomizer
  const api = create_api(broadcaster, store, randomizer)
  const gameserver: Express = express()
    
  gameserver.use(function(_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH");
    next();
  });
    
  gameserver.use(bodyParser.json())
    
  gameserver.post('/pending-games', async (req: TypedRequest<{creator: string, number_of_players: number}>, res: Response<PendingGame<IdClass>|IndexedMemento<IdClass>>) => {
    const { creator, number_of_players } = req.body
    const game = await api.new_game(creator, number_of_players)
    send(res, await game.map(toMemento))
  })

  gameserver.get('/pending-games', async (_: Request, res: Response<Readonly<PendingGame<IdClass>[]>>) => {
    send(res, await api.pending_games())
  })

  gameserver.get('/pending-games/:id', async (req: Request, res: Response<PendingGame<IdClass>>) => {
    send(res, await api.pending_game(store.to_id(req.params.id)))
  })

  gameserver.get('/pending-games/:id/players', async (req: Request, res: Response<readonly string[]>) => {
    const game = await api.game(store.to_id(req.params.id))
    const players = game.map(async g => g.players())
    send(res, await players)
  })

  gameserver.post('/pending-games/:id/players', async (req: TypedRequest<{player: string}>, res: Response<PendingGame<IdClass>|IndexedMemento<IdClass>>) => {
    const id = store.to_id(req.params.id)
    const g = await api.join(id, req.body.player)
    send(res, await g.map(toMemento))
  })

  gameserver.get('/games', async (_: Request, res: Response<Readonly<IndexedMemento<IdClass>[]>>) => {
    const gs = await api.games()
    send(res, await gs.map(async g => g.map(to_memento)))
  })

  gameserver.get('/games/:id', async (req: Request, res: Response<IndexedMemento<IdClass>>) => {
    const g = await api.game(store.to_id(req.params.id))
    send(res, await g.map(async g => to_memento(g)))
  })

  function resolve_action(id: IdClass, action: Action) {
    switch (action.type) {
      case 'reroll':
        return api.reroll(id, action.held, action.player)
      case 'register':
        return api.register(id, action.slot, action.player)
    }
  }
    
  gameserver.post('/games/:id/actions', async (req: TypedRequest<Action>, res: Response) => {
    const game = await resolve_action(store.to_id(req.params.id), req.body)
    send(res, game)
  })
    
  gameserver.listen(8080, () => console.log('Gameserver listening on 8080'))
}

function configAndStart(ws: WebSocket) {
  const mongoIndex = process.argv.indexOf('--mongodb')
  if (mongoIndex !== -1) {
    const connectionString = process.argv[mongoIndex + 1]
    if (!connectionString)
      throw new Error('--mongodb needs connection string')
    const dbNameIndex = process.argv.indexOf('--dbname')
    const dbName = dbNameIndex !== -1? process.argv[dbNameIndex + 1] : 'test'
    start_server(ws, MongoStore(connectionString, dbName, standardRandomizer))
  } else
    start_server(ws, new MemoryStore(from_memento(game0, standardRandomizer)))
}

const ws = new WebSocket('ws://localhost:9090/publish')
ws.onopen = e => configAndStart(e.target)
