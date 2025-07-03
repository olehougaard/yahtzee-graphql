import { describe, it, expect } from '@jest/globals'
import { lower_section as new_lower_section, LowerSection, PlayerScores, register, register_lower, register_upper, total_lower, total_upper, upper_section, UpperSection, bonus } from '../src/model/yahtzee.score'
import { die_values, DieArray } from '../src/model/dice'
import { lower_section_slots, LowerSlotKey } from '../src/model/yahtzee.slots'
import { repeat } from '../src/utils/array_utils'

function from_upper(scores: DieArray<number | undefined>): PlayerScores {
  const upper_section = { scores }
  const lower_section = new_lower_section()
  return { upper_section, lower_section }
}

describe("Upper section", () => {
  describe("new", () => {
    const section = upper_section()

    it("has undefined for all scores", () => {
      expect(die_values.map(d => section.scores[d])).toEqual(repeat(undefined, 6))
    })
  })

  describe("registering first score", () => {
    const section = upper_section()
    const registered = register_upper(section, 3, [3, 1, 3, 2, 6])
    it("Registers the score in the appropriate slot", () => {
      expect(registered.scores[3]).toEqual(6)
    })
  })

  describe("registering last score", () => {
    const scores = from_upper({
        [1]: undefined,
        [2]: 6,
        [3]: 6,
        [4]: 16,
        [5]: 15,
        [6]: 18
      })
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
    const scores: PlayerScores = from_upper({
          [1]: undefined,
          [2]: 6,
          [3]: 6,
          [4]: 16,
          [5]: 15,
          [6]: 18
        })
    it("adds all the defined scores", () => {
      expect(total_upper(scores)).toEqual(6 + 6 + 16 + 15 + 18)
    })
    it("adds the bonus if defined", () => {
      const registered = register(scores, 1, [6, 2, 1, 6, 1])
      expect(total_upper(registered)).toEqual(2 + 6 + 6 + 16 + 15 + 18 + 50)
    })
  })
})

describe("lower section", () => {
  describe("new", () => {
    const section: LowerSection = new_lower_section()
    const lower_section_keys = Object.keys(lower_section_slots) as LowerSlotKey[]
    it("has undefined for all scores", () => {
      expect(lower_section_keys.map(k => section.scores[k])).toEqual(Array.from(new Array(lower_section_keys.length), _ => undefined))
    })
  })

  describe("registering a score", () => {
    const section = new_lower_section()
    it("Registers the score in the appropriate slot", () => {
      const registered = register_lower(section, 'pair', [3, 1, 3, 2, 6])
      expect(registered.scores['pair']).toEqual(6)
    })
    it("Registers the score as 0 if the roll doesn't match the slot", () => {
      const registered = register_lower(section, 'full house', [3, 1, 3, 2, 6])
      expect(registered.scores['full house']).toEqual(0)
    })
  })

  describe("totalling the section", () => {
    const lower_section: LowerSection = {
      scores: {
        pair: 6,
        ['two pairs']: 6,
        ['small straight']: 15,
        chance: 25,
        yahtzee: 18
      }
    }
    const scores = { upper_section: upper_section(), lower_section }
    it("adds all the defined scores", () => {
      expect(total_lower(scores)).toEqual(6 + 6 + 15 + 25 + 18)
    })
  })
})