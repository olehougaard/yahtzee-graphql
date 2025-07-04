import { die_values, DieValue } from "./dice"

type Scored = { readonly score: (roll: Roll) => number }

type NumberSlot = {
    readonly type: 'number',
    readonly target: DieValue
}

type OfAKindSlot = {
    readonly type: 'kind'
    readonly count: number
}

type SlotType = NumberSlot | OfAKindSlot | { readonly type: 'yahtzee' | 'two pair' | 'full house' | 'small straight' | 'large straight'| 'chance' }

export type Roll = Readonly<DieValue[]>

export type Slot = SlotType & Scored

function count_dice(target: number, roll: Roll): number {
    return roll.filter(d => d === target).length
}

function of_a_kind(count: number, roll: Roll): number {
    const candidates = die_values
        .toReversed()
        .filter(target => count_dice(target, roll) >= count)
    return candidates[0] ?? 0
}

function two_kinds(count1: number, count2: number, roll: Roll): number {
    const on_top = of_a_kind(count1, roll)
    if (on_top === 0) return 0
    const on_bottom = of_a_kind(count2, roll.filter(d => d !== on_top))
    if (on_bottom === 0) return 0
    return count1 * on_top + count2 * on_bottom
}

function straight(from: DieValue, score: number, roll: Roll) {
  return roll.toSorted().every((d, i) => d === i + from)? score : 0
}

export function number_slot(target: DieValue): NumberSlot & Scored {
    return {
        type: 'number',
        target,
        score(roll: Roll) {
          return count_dice(target, roll) * target
        }
    }
}

const of_a_kind_slot = (count: number): Slot => ({
  type: 'kind', 
  count,
  score(roll: Roll) {
    return of_a_kind(count, roll) * count
  }
})

export const pair_slot: Slot = of_a_kind_slot(2)
export const two_pairs_slot: Slot = { type: 'two pair', score: two_kinds.bind(null, 2, 2) }
export const trips_slot: Slot = of_a_kind_slot(3)
export const quads_slot: Slot = of_a_kind_slot(4)
export const full_house_slot: Slot = { type: 'full house', score: two_kinds.bind(null, 3, 2) }
export const small_straight_slot: Slot = { type: 'small straight', score: straight.bind(null, 1, 15) }
export const large_straight_slot: Slot = { type: 'large straight', score: straight.bind(null, 2, 20) }
export const chance_slot: Slot = { type: 'chance', score: roll => roll.reduce((s, d) => s + d, 0) }
export const yahtzee_slot: Slot = { type: 'yahtzee', score: roll => of_a_kind(5, roll) > 0? 50 : 0 }

const die_value_slots = die_values.map(v => [v, number_slot(v)] as [DieValue, NumberSlot & Scored])

export const upper_section_slots = Object.fromEntries(die_value_slots) as Record<DieValue, NumberSlot & Scored>

export const lower_section_slots = {
  'pair': pair_slot,
  'two pairs': two_pairs_slot,
  'three of a kind': trips_slot,
  'four of a kind': quads_slot,
  'full house': full_house_slot,
  'small straight': small_straight_slot,
  'large straight': large_straight_slot,
  'chance': chance_slot,
  'yahtzee': yahtzee_slot
} as const


export const slots = { ...upper_section_slots, ...lower_section_slots } as const

export type UpperSlotKey = keyof typeof upper_section_slots

export type LowerSlotKey = keyof typeof lower_section_slots

export type SlotKey = keyof typeof slots

export function isUpperSlotKey(key: SlotKey): key is UpperSlotKey {
  return die_values.indexOf(key as any) !== -1
}

export const lower_section_keys = Object.keys(lower_section_slots) as LowerSlotKey[]