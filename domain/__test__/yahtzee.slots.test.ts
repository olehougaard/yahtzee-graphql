import { describe, it, expect } from '@jest/globals'
import { chance_slot, full_house_slot, large_straight_slot, number_slot, pair_slot, quads_slot, score, small_straight_slot, trips_slot, two_pairs_slot, yahtzee_slot } from '../src/model/yahtzee.slots'

describe("number slots", () => {
    const slot = number_slot(5)
    it("has the number of the slot", () => {
        expect(slot.target).toEqual(5)
    })
    it("scores a throw as the sum of the die that hit the target", () => {
        expect(score(slot, [1, 2, 5, 3, 5])).toEqual(10)
    }) 
    it("scores a throw even if it fits another slot", () => {
        expect(score(slot, [1, 2, 3, 4, 5])).toEqual(5)
    }) 
})

describe("pair slot", () => {
    it("scores a pair as the sum of the dice values", () => {
        expect(score(pair_slot, [1, 2, 4, 4, 6])).toEqual(8)
    })
    it("scores the higher of two pairs", () => {
        expect(score(pair_slot, [1, 1, 4, 4, 6])).toEqual(8)
    })
    it("scores three-of-a-kind as only two values", () => {
        expect(score(pair_slot, [1, 4, 4, 4, 6])).toEqual(8)
    })
    it("scores non-pairs as 0", () => {
        expect(score(pair_slot, [1, 2, 3, 4, 6])).toEqual(0)
    })
})

describe("two pair slot", () => {
    it("scores a pair as 0", () => {
        expect(score(two_pairs_slot, [1, 2, 4, 4, 6])).toEqual(0)
    })
    it("scores two pairs as the sum of die", () => {
        expect(score(two_pairs_slot, [1, 1, 4, 4, 6])).toEqual(10)
    })
    it("scores four-of-a-kind as 0", () => {
        expect(score(two_pairs_slot, [1, 4, 4, 4, 4])).toEqual(0)
    })
    it("scores non-pairs as 0", () => {
        expect(score(two_pairs_slot, [1, 2, 3, 4, 6])).toEqual(0)
    })
})

describe("trips slot", () => {
    it("scores three-of-a-kind as the sum of the dice values", () => {
        expect(score(trips_slot, [1, 4, 4, 4, 6])).toEqual(12)
    })
    it("scores pairs as 0", () => {
        expect(score(trips_slot, [1, 1, 4, 4, 6])).toEqual(0)
    })
    it("scores four-of-a-kind as only two values", () => {
        expect(score(trips_slot, [1, 4, 4, 4, 4])).toEqual(12)
    })
    it("scores non-trips as 0", () => {
        expect(score(trips_slot, [1, 2, 3, 4, 6])).toEqual(0)
    })
})

describe("quads slot", () => {
    it("scores four-of-a-kind as the sum of the dice values", () => {
        expect(score(quads_slot, [1, 4, 4, 4, 4])).toEqual(16)
    })
    it("scores five-of-a-kind (yahtzee) as only four values", () => {
        expect(score(quads_slot, [4, 4, 4, 4, 4])).toEqual(16)
    })
    it("scores non-quads as 0", () => {
        expect(score(quads_slot, [1, 2, 2, 2, 6])).toEqual(0)
    })
})

describe("full house slot", () => {
    it("scores trips as 0", () => {
        expect(score(full_house_slot, [1, 4, 4, 4, 6])).toEqual(0)
    })
    it("scores full house as the sum of the die", () => {
        expect(score(full_house_slot, [1, 4, 4, 4, 1])).toEqual(14)
    })
    it("scores yahtzee as 0", () => {
        expect(score(full_house_slot, [4, 4, 4, 4, 4])).toEqual(0)
    })
    it("scores non-pairs as 0", () => {
        expect(score(full_house_slot, [1, 2, 3, 4, 6])).toEqual(0)
    })
})

describe("small straight slot", () => {
    it("Scores 1, 2, 3, 4, 5 as 15", () => {
        expect(score(small_straight_slot, [1, 2, 3, 4, 5])).toEqual(15)
    })
    it("Scores the same regardless of order", () => {
        expect(score(small_straight_slot, [2, 3, 4, 5, 1])).toEqual(15)
    })
    it("Scores large straight as 0", () => {
        expect(score(small_straight_slot, [2, 3, 4, 5, 6])).toEqual(0)
    })
    it("Scores non-straight as 0", () => {
        expect(score(small_straight_slot, [2, 4, 4, 5, 1])).toEqual(0)
    })
})

describe("large straight slot", () => {
    it("Scores 2, 3, 4, 5, 6 as 20", () => {
        expect(score(large_straight_slot, [2, 3, 4, 5, 6])).toEqual(20)
    })
    it("Scores the same regardless of order", () => {
        expect(score(large_straight_slot, [6, 2, 3, 4, 5])).toEqual(20)
    })
    it("Scores small straight as 0", () => {
        expect(score(large_straight_slot, [1, 2, 3, 4, 5])).toEqual(0)
    })
    it("Scores non-straight as 0", () => {
        expect(score(large_straight_slot, [2, 4, 4, 5, 1])).toEqual(0)
    })
})

describe("chance slot", () => {
    it("Scores as roll as the sum of die", () => {
        expect(score(chance_slot, [2, 3, 1, 5, 5])).toEqual(16)
    })
    it("has a minimum score of 5", () => {
        expect(score(chance_slot, [1, 1, 1, 1, 1])).toEqual(5)
    })
    it("has a maximum score of 30", () => {
        expect(score(chance_slot, [6, 6, 6, 6, 6])).toEqual(30)
    })
})

describe("yahtzee slot", () => {
    it("scores yahtzee as 50", () => {
        expect(score(yahtzee_slot, [1, 1, 1, 1, 1])).toEqual(50)
    })
    it("scores non-yahtzee as 0", () => {
        expect(score(yahtzee_slot, [2, 2, 2, 2, 6])).toEqual(0)
    })
})
