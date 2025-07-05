import express, { type Express, type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import create_api from './api'
import { IndexedYahtzee, PendingGame, ServerError } from './servermodel'
import { WebSocket } from 'ws'
import { SlotKey } from 'domain/src/model/yahtzee.slots'
import { ServerResponse } from './response'
import { from_memento, IndexedMemento, to_memento } from './memento'
import { MemoryStore } from './memorystore'
import { standardRandomizer } from 'domain/src/utils/random_utils'

const game0: IndexedMemento = {
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
  pending: false
}

interface TypedRequest<BodyType> extends Request {
  body: BodyType
}

type RawAction = { type: 'reroll', held: number[] } 
               | { type: 'register', slot: SlotKey }

type Action = RawAction & { player: string }

function send<T>(res: Response<T>, response: ServerResponse<T, ServerError>) {
  response.process(value => res.send(value))
  response.processError(e => {
    switch(e.type) {
      case 'Not Found': 
        res.sendStatus(404)
        break
      case 'Forbidden':
        res.sendStatus(403)
        break
    }
  })
}

function toMemento(game: PendingGame | IndexedYahtzee): PendingGame | IndexedMemento {
  if (game.pending)
    return game
  else
    return to_memento(game)
}

function start_server(ws: WebSocket) {
  const broadcaster = {
    send(game: PendingGame | IndexedYahtzee) {
     ws.send(JSON.stringify({type: 'send', message: toMemento(game)}))
    }
  }

  const randomizer = standardRandomizer
  const api = create_api(broadcaster, new MemoryStore(from_memento(game0, randomizer)), randomizer)
  const gameserver: Express = express()
    
  gameserver.use(function(_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH");
    next();
  });
    
  gameserver.use(bodyParser.json())
    
  gameserver.post('/pending-games', async (req: TypedRequest<{creator: string, number_of_players: number}>, res: Response<PendingGame|IndexedMemento>) => {
    const { creator, number_of_players } = req.body
    const game = api.new_game(creator, number_of_players)
    send(res, game.map(toMemento))
  })

  gameserver.get('/pending-games', async (_: Request, res: Response<Readonly<PendingGame[]>>) => {
    send(res, api.pending_games())
  })

  gameserver.get('/pending-games/:id', async (req: Request, res: Response<PendingGame>) => {
    send(res, api.pending_game(parseInt(req.params.id)))
  })

  gameserver.get('/pending-games/:id/players', async (req: Request, res: Response<readonly string[]>) => {
    const players = api.game(parseInt(req.params.id)).map(g => g.players())
    send(res, players)
  })

  gameserver.post('/pending-games/:id/players', async (req: TypedRequest<{player: string}>, res: Response<PendingGame|IndexedMemento>) => {
    const id = parseInt(req.params.id)
    const g = api.join(id, req.body.player)
    send(res, g.map(toMemento))
  })

  gameserver.get('/games', async (_: Request, res: Response<Readonly<IndexedMemento[]>>) => {
    const gs = api.games()
    send(res, gs.map(g => g.map(to_memento)))
  })

  gameserver.get('/games/:id', async (req: Request, res: Response<IndexedMemento>) => {
    const g = api.game(parseInt(req.params.id))
    send(res, g.map(to_memento))
  })

  function resolve_action(id: number, action: Action) {
    switch (action.type) {
      case 'reroll':
        return api.reroll(id, action.held, action.player)
      case 'register':
        return api.register(id, action.slot, action.player)
    }
  }
    
  gameserver.post('/games/:id/actions', async (req: TypedRequest<Action>, res: Response) => {
    const game = resolve_action(parseInt(req.params.id), req.body)
    send(res, game)
  })
    
  gameserver.listen(8080, () => console.log('Gameserver listening on 8080'))
}

const ws = new WebSocket('ws://localhost:9090/publish')
ws.onopen = e => start_server(e.target)
