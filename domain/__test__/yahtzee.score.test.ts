import { describe, it, expect } from '@jest/globals'
import { PlayerScoresMemento, register, bonus, new_scores_memento, sum, total, is_finished } from '../src/model/yahtzee.score.memento'
import { die_values } from '../src/model/dice'
import { lower_section_slots, LowerSlotKey } from '../src/model/yahtzee.slots'
import { repeat } from '../src/utils/array_utils'

describe("Upper section", () => {
  describe("new", () => {
    const section = new_scores_memento()

    it("has undefined for all scores", () => {
      expect(die_values.map(d => section[d])).toEqual(repeat(undefined, 6))
    })
  })

  describe("registering first score", () => {
    const section = new_scores_memento()
    const registered = register(section, 3, [3, 1, 3, 2, 6])
    it("Registers the score in the appropriate slot", () => {
      expect(registered[3]).toEqual(6)
    })
  })

  describe("registering last score", () => {
    const scores = {
        [1]: undefined,
        [2]: 6,
        [3]: 6,
        [4]: 16,
        [5]: 15,
        [6]: 18
      }
    it("fills the bonus with 50 if total >= 63", () => {
      const registered = register(scores, 1, [6, 2, 1, 6, 1])
      expect(bonus(registered)).toEqual(50)
    })
    it("fills the bonus with 50 if total < 63", () => {
      const registered = register(scores, 1, [6, 2, 1, 6, 6])
      expect(bonus(registered)).toEqual(0)
    })
  })

  describe("totalling the section", () => {
    const scores: PlayerScoresMemento = {
          [1]: undefined,
          [2]: 6,
          [3]: 6,
          [4]: 16,
          [5]: 15,
          [6]: 18,
        }
    it("adds all the defined scores", () => {
      expect(total(scores)).toEqual(6 + 6 + 16 + 15 + 18)
    })
    it("adds the bonus if defined", () => {
      const registered = register(scores, 1, [6, 2, 1, 6, 1])
      expect(total(registered)).toEqual(2 + 6 + 6 + 16 + 15 + 18 + 50)
    })
  })
})

describe("lower section", () => {
  describe("new", () => {
    const scores = new_scores_memento()
    const lower_section_keys = Object.keys(lower_section_slots) as LowerSlotKey[]
    it("has undefined for all scores", () => {
      expect(lower_section_keys.map(k => scores[k])).toEqual(Array.from(new Array(lower_section_keys.length), _ => undefined))
    })
  })

  describe("registering a score", () => {
    const scores = new_scores_memento()
    it("Registers the score in the appropriate slot", () => {
      const registered = register(scores, 'pair', [3, 1, 3, 2, 6])
      expect(registered['pair']).toEqual(6)
    })
    it("Registers the score as 0 if the roll doesn't match the slot", () => {
      const registered = register(scores, 'full house', [3, 1, 3, 2, 6])
      expect(registered['full house']).toEqual(0)
    })
  })

  describe("totalling the section", () => {
    const scores: PlayerScoresMemento = {
      [1]: undefined,
      [2]: undefined,
      [3]: undefined,
      [4]: undefined,
      [5]: undefined,
      [6]: undefined,
      pair: 6,
      ['two pairs']: 6,
      ['small straight']: 15,
      chance: 25,
      yahtzee: 18
    }
    it("adds all the defined scores", () => {
      expect(total(scores)).toEqual(6 + 6 + 15 + 25 + 18)
    })
  })
})

describe("player scores", () => {
  describe("new player scores", () => {
    const scores: PlayerScoresMemento = new_scores_memento()

    it("has a sum of 0", () => {
      expect(sum(scores)).toEqual(0)
    })

    it("has undefined bonus", () => {
      expect(bonus(scores)).toEqual(0)
    })

    it("has a total of 0", () => {
      expect(total(scores)).toEqual(0)
    })

    it("is unfinished", () => {
      expect(is_finished(scores)).toBeFalsy()
    })
  })
})
