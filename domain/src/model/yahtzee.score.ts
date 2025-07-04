import { die_values, DieArray } from './dice'
import { lower_section_slots, upper_section_slots, Roll, SlotKey } from './yahtzee.slots'

export const slots = { ...lower_section_slots, ...upper_section_slots }

export type UpperSection = Readonly<DieArray<number | undefined>>

type LowerSectionSlots = typeof lower_section_slots

type LowerSectionKey = keyof LowerSectionSlots

export type LowerSection = Readonly<Partial<Record<LowerSectionKey, number>>>

export type PlayerScores = UpperSection & LowerSection

const lower_section_keys: Readonly<LowerSectionKey[]> = Object.keys(lower_section_slots) as LowerSectionKey[]

const slot_keys: Readonly<LowerSectionKey[]> = Object.keys(slots) as LowerSectionKey[]

function upper_section(): UpperSection {
  return Object.fromEntries(die_values.map(v => [v, undefined])) as DieArray<undefined>
}

export function lower_section(): LowerSection {
  return { }
}


export function new_scores(): PlayerScores {
  return { ...upper_section(), ...lower_section() }
}

export function register(scores: PlayerScores, key: SlotKey, roll: Roll): PlayerScores {
  return { ...scores, [key]: slots[key].score(roll) }
}

export function slot_score(scores: PlayerScores, key: SlotKey): number | undefined {
  return scores[key]
}

export function sum(scores: DieArray<number | undefined>): number {
  return die_values
    .map(key => scores[key] ?? 0)
    .reduce((s, v) => s + v, 0)
}

export function bonus(scores: PlayerScores): number | undefined {
  return sum(scores) >= 63? 50 : 0
}

export function registered(scores: PlayerScores, key: SlotKey): boolean {
  return slot_score(scores, key) !== undefined
}

export function is_finished(scores: PlayerScores): boolean {
  return slot_keys.map(k => scores[k]).every(s => s !== undefined)
}

export function total_upper(scores: PlayerScores): number {
  return (sum(scores) ?? 0) + (bonus(scores) ?? 0)
}

export function total_lower(scores: PlayerScores): number {
  return lower_section_keys
  .map(key => scores[key] ?? 0)
    .reduce((s, v) => s + v , 0)
}

export function total(scores: PlayerScores) {
  return total_upper(scores) + total_lower(scores)
}
