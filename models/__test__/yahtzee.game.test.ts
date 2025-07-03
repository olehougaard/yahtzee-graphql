import { describe, it, expect } from '@jest/globals'
import { is_finished, new_yahtzee, register, reroll, scores, Yahtzee } from '../src/model/yahtzee.game'
import { non_random } from './test_utils'
import { total } from '../src/model/yahtzee.score'
import { update } from '../src/utils/array_utils'
import { dice_roller } from '../src/model/dice'

describe("new game", () => {
  const yahtzee = new_yahtzee({
    players: ['A', 'B', 'C', 'D'], 
    randomizer: non_random(
      3, 1, 0, // Reversing in Fisher-Yates
      2, 4, 3, 1, 0 // First roll - one is added to these
    ) 
  })
  it("shuffles the order of players", () => {
    expect(yahtzee.players).toEqual(['D', 'C', 'B', 'A'])
  })
  it("has a player score per player", () => {
    expect(yahtzee.scores.length).toEqual(4)
  })
  it("has new scores", () => {
    expect(yahtzee.scores.map(total)).toEqual([0, 0, 0, 0])
  })
  it("starts with player index 0", () => {
    expect(yahtzee.playerInTurn).toEqual(0)
  })
  it("starts with die already rolled", () => {
    expect(yahtzee.roll).toEqual([3, 5, 4, 2, 1])
  })
  it("starts with having two rerolls remaining", () => {
    expect(yahtzee.rolls_left).toEqual(2)
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
  it("replaces the non-held dice", () => {
    expect(reroll([1, 2, 3], yahtzee).roll).toEqual([2, 5, 4, 2, 6])
  })
  it("decrements the remaining rerolls", () => {
    expect(reroll([1, 2, 3], yahtzee).rolls_left).toEqual(1)
  })
  it("disallows re-rolling if no rolls are left", () => {
    expect(() => reroll([1, 2, 3], {...yahtzee, rolls_left: 0})).toThrow()
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
  it("replaces the non-held dice", () => {
    expect(reroll([1, 2, 3], yahtzee).roll).toEqual([2, 5, 4, 2, 6])
  })
  it("decrements the remaining rerolls", () => {
    expect(reroll([1, 2, 3], yahtzee).rolls_left).toEqual(1)
  })
  it("disallows re-rolling if no rolls are left", () => {
    expect(() => reroll([1, 2, 3], {...yahtzee, rolls_left: 0})).toThrow()
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
    const rerolled = reroll([1, 2, 3], yahtzee)
    const rerolled_twice = reroll([1, 2, 3, 4], rerolled)
    const registered = register(2, rerolled_twice)
    it("registers the score", () => {
      expect(total(registered.scores[0])).toEqual(2)
    })
    it("moves to the next player", () => {
      expect(registered.playerInTurn).toEqual(1)
    })
    it("moves to the first player after the last player", () => {
      const registered = register(2, { ...rerolled_twice, playerInTurn: 3 })
      expect(registered.playerInTurn).toEqual(0)
    })
    it("rolls new dice", () => {
      expect(registered.roll).toEqual([6, 5, 4, 3, 2])
    })
    it("has two rerolls left", () => {
      expect(registered.rolls_left).toEqual(2)
    })
    it("disallows registering an already registered slot", () => {
      const scores = {...rerolled_twice.scores[0]}
      const upper_section = {...scores.upper_section, [2]: 8}
      const used = {
        ...rerolled_twice,
        scores: update(0, { ...scores, upper_section }, rerolled_twice.scores)
      }
      expect(() => register(2, used)).toThrow()
    })
    it("allows registering before all rerolls are used", () => {
      const registered = register(2, yahtzee)
      expect(total(registered.scores[0])).toEqual(2)
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
    const rerolled = reroll([1, 2, 3], yahtzee)
    const rerolled_twice = reroll([1, 2, 3, 4], rerolled)
    const registered = register('large straight', rerolled_twice)
    it("registers the score", () => {
      expect(total(registered.scores[0])).toEqual(20)
    })
    it("moves to the next player", () => {
      expect(registered.playerInTurn).toEqual(1)
    })
    it("moves to the first player after the last player", () => {
      const registered = register('large straight', { ...rerolled_twice, playerInTurn: 3 })
      expect(registered.playerInTurn).toEqual(0)
    })
    it("rolls new dice", () => {
      expect(registered.roll).toEqual([6, 5, 4, 3, 2])
    })
    it("has two rerolls left", () => {
      expect(registered.rolls_left).toEqual(2)
    })
    it("disallows registering an already registered slot", () => {
      const scores = {...rerolled_twice.scores[0]}
      const lower_section = {scores: {...scores.lower_section.scores, ['large straight']: 20}}
      const used = {
        ...rerolled_twice,
        scores: update(0, { ...scores, lower_section }, rerolled_twice.scores)
      }
      expect(() => register('large straight', used)).toThrow()
    })
    it("allows registering before all rerolls are used", () => {
      const registered = register('small straight', yahtzee)
      expect(total(registered.scores[0])).toEqual(15)
    })
  })
})

const finished: Yahtzee = {
  players: ['B', 'A'],
  scores: [
    {
      upper_section: {[1]: 3, [2]: 6, [3]: 9, [4]: 12, [5]: 15, [6]: 18},
      lower_section: {scores: {
        'pair': 12,
        'two pairs': 20,
        'three of a kind': 15,
        'four of a kind': 0,
        'small straight': 15,
        'large straight': 0,
        'full house': 0,
        'chance': 22,
        'yahtzee': 0
      }}
    },
    {
      upper_section: {
        [1]: 2, [2]: 6, [3]: 9, [4]: 12, [5]: 15, [6]: 18
      },
      lower_section: {scores: {
        'pair': 10,
        'two pairs': 18,
        'three of a kind': 18,
        'four of a kind': 16,
        'small straight': 0,
        'large straight': 0,
        'full house': 26,
        'chance': 24,
        'yahtzee': 50
      }}
    }
  ],
  playerInTurn: 0,
  roll: [],
  rolls_left: 2,
  roller: dice_roller(() => 0)
}

const {roller, ...cloneable } = finished
const almost_finished = {...structuredClone(cloneable), roller}
almost_finished.scores[0].lower_section.scores['yahtzee'] = undefined
almost_finished.scores[1].upper_section = {...almost_finished.scores[1].upper_section, [1]: undefined}

describe("scores", () => {
  it("returns an array with the sums of the scores", () => {
    expect(scores(finished)).toEqual([113 + 84, 62 + 162])
  })
  it("also works on unfinished games", () => {
    expect(scores(almost_finished)).toEqual([113 + 84, 60 + 162])
  })
  it("returns zeroes for a new game", () => {
    const yahtzee = new_yahtzee({
      players: ['A', 'B', 'C', 'D'], 
      randomizer: non_random(
        3, 1, 0, // Reversing in Fisher-Yates
        2, 4, 3, 1, 0 // First roll - one is added to these
      ) 
    })
    expect(scores(yahtzee)).toEqual([0, 0, 0, 0])
  })
})

describe("is_finished", () => {
  it("returns false if the game isn't finished", () => {
    expect(is_finished(almost_finished)).toBeFalsy()
  })
  it("returns true if the game is finished", () => {
    expect(is_finished(finished)).toBeTruthy()
  })
})
