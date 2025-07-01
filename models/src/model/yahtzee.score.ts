import { die_values, DieValue, DieArray } from './dice'
import { chance_slot, full_house_slot, large_straight_slot, number_slot, pair_slot, quads_slot, score, small_straight_slot, trips_slot, two_pair_slot as two_pairs_slot, yahtzee_slot, type Slot } from './yahtzee.slots'

export const upper_section_slots: DieArray<Slot> = {
  [1]: number_slot(1),
  [2]: number_slot(2),
  [3]: number_slot(3),
  [4]: number_slot(4),
  [5]: number_slot(5),
  [6]: number_slot(6),
} as const

export type UpperSection = Readonly<{
  scores: DieArray<number | undefined>,
  bonus?: 0 | 50
}>

export function upper_section(): UpperSection {
  return { 
    scores: Object.fromEntries(die_values.map(v => [v, undefined])) as DieArray<undefined>
  }
}

export function sum_upper(scores: DieArray<number | undefined>): number {
  return Object.values(scores)
    .map(v => v ?? 0)
    .reduce((s, v) => s + v, 0)
}

export function finished_upper(section: UpperSection): boolean {
  return Object.values(section.scores).every(s => s !== undefined)
}

export function register_upper(section: UpperSection, value: DieValue, roll: DieValue[]): UpperSection {
  const scores = { ...section.scores, [value]: score(upper_section_slots[value], roll) }
  if (finished_upper({scores})) {
    const total = sum_upper(scores)
    return { ...section, scores, bonus: total >= 63? 50 : 0}
  }
  return { ...section, scores}
}

export function total_upper(section: UpperSection): number {
  return sum_upper(section.scores) + (section.bonus ?? 0)
}

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


type LowerSectionSlots = typeof lower_section_slots

export type LowerSectionKey = keyof LowerSectionSlots

export const lower_section_keys: Readonly<LowerSectionKey[]> = Object.keys(lower_section_slots) as LowerSectionKey[]

export function isLowerSection(key: any): key is LowerSectionKey {
  return lower_section_keys.indexOf(key) !== -1
}

export type LowerSection = {
  scores: Partial<Record<LowerSectionKey, number>>
}

export function lower_section(): LowerSection {
  return { scores: { }}
}

export function finished_lower(section: LowerSection): boolean {
  return lower_section_keys.every(key => section.scores[key] !== undefined)
}

export function register_lower(section: LowerSection, key: LowerSectionKey, roll: DieValue[]):  LowerSection {
  const scores = { ...section.scores, [key]: score(lower_section_slots[key], roll) }
  return {scores}
}

export function total_lower(section: LowerSection): number {
  return lower_section_keys
    .map(k => section.scores[k] ?? 0)
    .reduce((a, b) => a + b , 0)
}