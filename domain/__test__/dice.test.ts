import { describe, it, expect, beforeEach } from '@jest/globals'
import { dice_roller, DieValue } from '../src/model/dice'
import { non_random } from './test_utils'

function dice_sequence(...die_rolls: number[]) {
    return non_random(...die_rolls.map(n => n - 1))
}

describe("rolling dice", () => {
    let roller = dice_roller(_ => 0)
    beforeEach(() => {
        const randomizer = dice_sequence(1, 3, 2, 4, 2)
        roller = dice_roller(randomizer)
    })
    it("returns the requested number of dice", () => {
        expect(roller.roll(5).length).toEqual(5)
    })
    it("returns the dice in the order given by the randomizer", () => {
        expect(roller.roll(5)).toEqual([1, 3, 2, 4, 2])
    })
})

describe("re-rolling dice", () => {
    let roller = dice_roller(_ => 0)
    let first_roll: DieValue[] = []
    beforeEach(() => {
        const randomizer = dice_sequence(1, 3, 2, 4, 2, 6, 5, 1, 6, 5)
        roller = dice_roller(randomizer)
        first_roll = roller.roll(5)
    })
    it("returns all new dice if nothing is held", () => {
        expect(roller.reroll(first_roll, [])).toEqual([6, 5, 1, 6, 5])
    })
    it("retains the dice that are held", () => {
        expect(roller.reroll(first_roll, [1, 3])).toEqual([6, 3, 5, 4, 1])
    })
    it("ignores indeces that are out of bounds", () => {
        expect(roller.reroll(first_roll, [-1, 6])).toEqual([6, 5, 1, 6, 5])
    })
})