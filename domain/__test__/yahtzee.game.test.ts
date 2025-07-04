import { describe, it, expect } from '@jest/globals'
import { from_memento, new_yahtzee, Yahtzee } from '../src/model/yahtzee.game'
import { non_random } from './test_utils'
import { total } from '../src/model/yahtzee.score'
import { update } from '../src/utils/array_utils'
import { YahtzeeMemento } from '../src/model/yahtzee.game.memento'
import { dice_roller } from '../src/model/dice'

function force_state(y: Yahtzee, props: Partial<YahtzeeMemento>) {
  return from_memento({...y.to_memento(), ...props}, y.roller)
}

describe("new game", () => {
  const yahtzee = new_yahtzee({
    players: ['A', 'B', 'C', 'D'], 
    randomizer: non_random(
      3, 1, 0, // Reversing in Fisher-Yates
      2, 4, 3, 1, 0 // First roll - one is added to these
    ) 
  })
  it("shuffles the order of players", () => {
    expect(yahtzee.players()).toEqual(['D', 'C', 'B', 'A'])
  })
  it("has new scores for each player", () => {
    expect(yahtzee.scores().map(total)).toEqual([0, 0, 0, 0])
  })
  it("starts with player index 0", () => {
    expect(yahtzee.inTurn()).toEqual(0)
  })
  it("starts with die already rolled", () => {
    expect(yahtzee.roll()).toEqual([3, 5, 4, 2, 1])
  })
  it("starts with having two rerolls remaining", () => {
    expect(yahtzee.rolls_left()).toEqual(2)
  })
  it("is unfinished", () => {
    expect(yahtzee.is_finished()).toBeFalsy()
  })
})

describe("reroll", () => {
  const yahtzee = new_yahtzee({
    players: ['A', 'B', 'C', 'D'], 
    randomizer: non_random(
      3, 1, 0, // Reversing in Fisher-Yates
      2, 4, 3, 1, 0, // First roll - one is added to these
      1, 5, //first re-roll
    ) 
  })
  yahtzee.reroll([1, 2, 3])
  it("replaces the non-held dice", () => {
    expect(yahtzee.roll()).toEqual([2, 5, 4, 2, 6])
  })
  it("decrements the remaining rerolls", () => {
    expect(yahtzee.rolls_left()).toEqual(1)
  })
  it("disallows re-rolling if no rolls are left", () => {
    yahtzee.reroll([])
    expect(() => yahtzee.reroll([1, 2, 3])).toThrow()
  })
})

describe("register", () => {
  describe("registering in the upper section", () => {
    const yahtzee = new_yahtzee({
      players: ['A', 'B', 'C', 'D'], 
      randomizer: non_random(
        3, 1, 0, // Reversing in Fisher-Yates
        2, 4, 3, 1, 0, // First roll - one is added to these
        1, 5, //first re-roll
        2, // second re-roll
        5, 4, 3, 2, 1, // new re-roll
      ) 
    })
    const rerolled = yahtzee.clone()
    rerolled.reroll([1, 2, 3])
    rerolled.reroll([1, 2, 3, 4])
    const registered = rerolled.clone()
    registered.register(2)
    it("registers the score", () => {
      expect(total(registered.scores()[0])).toEqual(2)
    })
    it("moves to the next player", () => {
      expect(registered.inTurn()).toEqual(1)
    })
    it("moves to the first player after the last player", () => {
      const registered = force_state(rerolled, {playerInTurn: 3})
      registered.register(2)
      expect(registered.inTurn()).toEqual(0)
    })
    it("rolls new dice", () => {
      expect(registered.roll()).toEqual([6, 5, 4, 3, 2])
    })
    it("has two rerolls left", () => {
      expect(registered.rolls_left()).toEqual(2)
    })
    it("disallows registering an already registered slot", () => {
      const scores = {...rerolled.scores()[0], [2]: 8}
      const used = force_state(rerolled, {
        scores: update(0, scores, [...rerolled.scores()])
      })
      expect(() => used.register(2)).toThrow()
    })
    it("allows registering before all rerolls are used", () => {
      const registered = yahtzee
      registered.register(2)
      expect(total(registered.scores()[0])).toEqual(2)
    })
  })

  describe("registering in lower the section", () => {
    const yahtzee = new_yahtzee({
      players: ['A', 'B', 'C', 'D'], 
      randomizer: non_random(
        3, 1, 0, // Reversing in Fisher-Yates
        2, 4, 3, 1, 0, // First roll - one is added to these
        1, 5, //first re-roll
        2, // second re-roll
        5, 4, 3, 2, 1, // new re-roll
      ) 
    })
    const rerolled = yahtzee.clone()
    rerolled.reroll([1, 2, 3])
    rerolled.reroll([1, 2, 3, 4])
    const registered = rerolled.clone()
    registered.register('large straight')
    it("registers the score", () => {
      expect(total(registered.scores()[0])).toEqual(20)
    })
    it("moves to the next player", () => {
      expect(registered.inTurn()).toEqual(1)
    })
    it("moves to the first player after the last player", () => {
      const registered = force_state(rerolled, { playerInTurn: 3})
      registered.register('large straight')
      expect(registered.inTurn()).toEqual(0)
    })
    it("rolls new dice", () => {
      expect(registered.roll()).toEqual([6, 5, 4, 3, 2])
    })
    it("has two rerolls left", () => {
      expect(registered.rolls_left()).toEqual(2)
    })
    it("disallows registering an already registered slot", () => {
      const scores = {...rerolled.scores()[0], ['large straight']: 20}
      const used = force_state(rerolled, {
        scores: update(0, scores, [...rerolled.scores()])
      })
      expect(() => used.register('large straight')).toThrow()
    })
    it("allows registering before all rerolls are used", () => {
      yahtzee.register('small straight')
      expect(total(yahtzee.scores()[0])).toEqual(15)
    })
  })
})

const almost_finished: Yahtzee = from_memento({
  players: ['B', 'A'],
  scores: [
    {
      [1]: 3, 
      [2]: 6, 
      [3]: 9, 
      [4]: 12, 
      [5]: 15, 
      [6]: 18,
      'pair': 12,
      'two pairs': 20,
      'three of a kind': 15,
      'four of a kind': 0,
      'small straight': 15,
      'large straight': 0,
      'full house': 0,
      'chance': 22,
      'yahtzee': undefined
    },
    {
      [1]: undefined, 
      [2]: 6, 
      [3]: 9, 
      [4]: 12, 
      [5]: 15, 
      [6]: 18,
      'pair': 10,
      'two pairs': 18,
      'three of a kind': 18,
      'four of a kind': 16,
      'small straight': 0,
      'large straight': 0,
      'full house': 26,
      'chance': 24,
      'yahtzee': 50
    }
  ],
  playerInTurn: 0,
  roll: [2, 1, 1, 1, 1], // Player 0 roll
  rolls_left: 2
}, dice_roller(non_random(
    0, 0, 2, 3, 4, // Player 1 roll
)))

const finished = almost_finished.clone()
finished.register('yahtzee')
finished.register(1)

describe("scores", () => {
  it("returns an array with the sums of the scores", () => {
    expect(finished.total_scores()).toEqual([113 + 84, 62 + 162])
  })
  it("also works on unfinished games", () => {
    expect(almost_finished.total_scores()).toEqual([113 + 84, 60 + 162])
  })
  it("returns zeroes for a new game", () => {
    const yahtzee = new_yahtzee({
      players: ['A', 'B', 'C', 'D'], 
      randomizer: non_random(
        3, 1, 0, // Reversing in Fisher-Yates
        2, 4, 3, 1, 0 // First roll - one is added to these
      ) 
    })
    expect(yahtzee.total_scores()).toEqual([0, 0, 0, 0])
  })
})

describe("is_finished", () => {
  it("returns false if the game isn't finished", () => {
    expect(almost_finished.is_finished()).toBeFalsy()
  })
  it("returns true if the game is finished", () => {
    expect(finished.is_finished()).toBeTruthy()
  })
})

describe("serialization", () => {
  describe("new game", () => {
    const new_game = new_yahtzee({players: ['A', 'B']})
    const transferred_game = from_memento(new_game.to_memento(), new_game.roller)
    it("is still unfinished when transferred", () => {
      expect(transferred_game.is_finished()).toBeFalsy()
    })
  })
})