import { times } from "../utils/array_utils"
import type { Randomizer } from "../utils/random_utils"

export const die_values = [1, 2, 3, 4, 5, 6] as const

export type DieValue = typeof die_values[number]

export type DieArray<T> = { [key in DieValue]: T }

export function isDieValue(x: any): x is DieValue {
    return die_values.indexOf(x) > -1
}

export interface DiceRoller {
    roll(n: number): DieValue[]
    reroll(rolled: DieValue[], held: number[]): DieValue[]
}

export function dice_roller(randomizer: Randomizer): DiceRoller {
    const random_dice = () => randomizer(6) + 1 as DieValue
    return {
        roll(n) {
            return times(random_dice, n)
        },
        reroll(rolled, held) {
            const s = new Set(held)
            return rolled.map((d, i) => s.has(i)? d : random_dice())
        }
    }
}
