import express, { type Express, type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import create_api from './api'
import { IndexedGame, PendingGame } from './servermodel'
import { WebSocket } from 'ws'
import { SlotKey } from 'models/src/model/yahtzee.slots'

interface TypedRequest<BodyType> extends Request {
  body: BodyType
}

type RawAction = { type: 'reroll', held: number[] } 
               | { type: 'register', slot: SlotKey }

type Action = RawAction & { player: string }

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
    res.send(game)
    api.broadcast(game)
  })

  gameserver.get('/pending-games', async (_: Request, res: Response<Readonly<PendingGame[]>>) => {
    const games = api.pending_games()
    res.send(games)
  })

  gameserver.get('/pending-games/:id', async (req: Request, res: Response<PendingGame>) => {
    const games = api.pending_games()
    const g = games.find(g => g.id === parseInt(req.params.id))
    if (!g)
      res.status(404).send()
    else
      res.send(g)
  })

  gameserver.get('/pending-games/:id/players', async (req: Request, res: Response<string[]>) => {
    const games = api.pending_games()
    const g = games.find(g => g.id === parseInt(req.params.id))
    if (!g)
      res.status(404).send()
    else
      res.send(g.players)
  })

  gameserver.post('/pending-games/:id/players', async (req: TypedRequest<{player: string}>, res: Response<PendingGame|IndexedGame>) => {
    const id = parseInt(req.params.id)
    try {
      const g = api.join(id, req.body.player)
      api.broadcast(g)
      res.send(g)
    } catch(e: any) {
      console.error(e)
      if (e.message === 'Not Found')
        res.status(404).send()
      res.status(403).send()
    }
  })

  gameserver.get('/games', async (_: Request, res: Response<Readonly<IndexedGame[]>>) => {
    const games = api.games()
    res.send(games)
  })

  gameserver.get('/games/:id', async (req: Request, res: Response<IndexedGame>) => {
    const games = api.games()
    const g = games.find(g => g.id === parseInt(req.params.id))
    if (!g)
      res.status(404).send()
    else
      res.send(g)
  })

  function resolve_action(id: number, action: Action): IndexedGame {
    switch (action.type) {
      case 'reroll':
        return api.reroll(id, action.held, action.player)
      case 'register':
        return api.register(id, action.slot, action.player)
    }
  }
    
  gameserver.post('/games/:id/actions', async (req: TypedRequest<Action>, res: Response) => {
    const id = parseInt(req.params.id)
    try {
      const game = resolve_action(id, req.body)
      res.send(game)
      api.broadcast(game)
    } catch (e: any) {
      if (e.message === 'Not Found')
        res.status(404).send()
      res.status(403).send()
    }
  })
    
  gameserver.listen(8080, () => console.log('Gameserver listening on 8080'))
}

const ws = new WebSocket('ws://localhost:9090/publish')
ws.onopen = e => start_server(e.target)
