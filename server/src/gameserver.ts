import express, { type Express, type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import create_api from './api'
import { IndexedGame, PendingGame, ServerError, StoreError } from './servermodel'
import { WebSocket } from 'ws'
import { SlotKey } from 'models/src/model/yahtzee.slots'
import { ServerResponse } from './response'

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

function start_server(ws: WebSocket) {
  const api = create_api(ws)
  const gameserver: Express = express()
    
  gameserver.use(function(_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH");
    next();
  });
    
  gameserver.use(bodyParser.json())
    
  gameserver.post('/pending-games', async (req: TypedRequest<{creator: string, number_of_players: number}>, res: Response<PendingGame|IndexedGame>) => {
    const { creator, number_of_players } = req.body
    const game = api.new_game(creator, number_of_players)
    send(res, game)
    game.process(api.broadcast)
  })

  gameserver.get('/pending-games', async (_: Request, res: Response<Readonly<PendingGame[]>>) => {
    send(res, api.pending_games())
  })

  gameserver.get('/pending-games/:id', async (req: Request, res: Response<PendingGame>) => {
    const games = api.pending_games()
      .map(gs => gs.find(g => g.id === parseInt(req.params.id)))
      .filter(g => g !== undefined, _ => ({ type: 'Not Found', key: req.params.id } as StoreError))
      .map(g => g!)
    send(res, games)
  })

  gameserver.get('/pending-games/:id/players', async (req: Request, res: Response<string[]>) => {
    const players = api.pending_games()
      .map(gs => gs.find(g => g.id === parseInt(req.params.id)))
      .filter(g => g !== undefined, _ => ({ type: 'Not Found', key: req.params.id } as StoreError))
      .map(g => g!.players)
    send(res, players)
  })

  gameserver.post('/pending-games/:id/players', async (req: TypedRequest<{player: string}>, res: Response<PendingGame|IndexedGame>) => {
    const id = parseInt(req.params.id)
    const g = api.join(id, req.body.player)
    g.process(api.broadcast)
    send(res, g)
  })

  gameserver.get('/games', async (_: Request, res: Response<Readonly<IndexedGame[]>>) => {
    const games = api.games()
    send(res, games)
  })

  gameserver.get('/games/:id', async (req: Request, res: Response<IndexedGame>) => {
    const games = api.games()
      .map(gs => gs.find(g => g.id === parseInt(req.params.id)))
      .filter(g => g !== undefined, _ => ({ type: 'Not Found', key: req.params.id } as StoreError))
      .map(g => g!)
    send(res, games)
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
    const id = parseInt(req.params.id)
    const game = resolve_action(id, req.body)
    send(res, game)
    game.process(api.broadcast)
  })
    
  gameserver.listen(8080, () => console.log('Gameserver listening on 8080'))
}

const ws = new WebSocket('ws://localhost:9090/publish')
ws.onopen = e => start_server(e.target)
