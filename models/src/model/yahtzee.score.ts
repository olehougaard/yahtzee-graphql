import { die_values, DieValue, DieArray } from './dice'
import { lower_section_slots, SlotKey, isUpperSlotKey, number_slot, score, Slot, Roll } from './yahtzee.slots'

export const upper_section_slots: DieArray<Slot> = {
  [1]: number_slot(1),
  [2]: number_slot(2),
  [3]: number_slot(3),
  [4]: number_slot(4),
  [5]: number_slot(5),
  [6]: number_slot(6),
} as const

export type UpperSection = Readonly<DieArray<number | undefined>>

export function upper_section(): UpperSection {
  return Object.fromEntries(die_values.map(v => [v, undefined])) as DieArray<undefined>
}

function sum_upper(scores: DieArray<number | undefined>): number {
  return Object.values(scores)
    .map(v => v ?? 0)
    .reduce((s, v) => s + v, 0)
}

export function finished_upper(section: UpperSection): boolean {
  return Object.values(section).every(s => s !== undefined)
}

export function register_upper(section: UpperSection, value: DieValue, roll: Roll): UpperSection {
  return { ...section, [value]: score(upper_section_slots[value], roll) }
}

type LowerSectionSlots = typeof lower_section_slots

type LowerSectionKey = keyof LowerSectionSlots

const lower_section_keys: Readonly<LowerSectionKey[]> = Object.keys(lower_section_slots) as LowerSectionKey[]

export type LowerSection = {
  scores: Partial<Record<LowerSectionKey, number>>
}

export function lower_section(): LowerSection {
  return { scores: { }}
}

export function finished_lower(section: LowerSection): boolean {
  return lower_section_keys.every(key => section.scores[key] !== undefined)
}

export function register_lower(section: LowerSection, key: LowerSectionKey, roll: Roll):  LowerSection {
  const scores = { ...section.scores, [key]: score(lower_section_slots[key], roll) }
  return {scores}
}

export type PlayerScores = {
  upper_section: UpperSection
  lower_section: LowerSection
}

export function new_scores() {
  return {
    upper_section: upper_section(),
    lower_section: lower_section()
  }
}

export function register(scores: PlayerScores, key: SlotKey, roll: Roll): PlayerScores {
  if (isUpperSlotKey(key)) {
    return { ...scores, upper_section: register_upper(scores.upper_section, key, roll)}
  } else {
    return { ...scores, lower_section: register_lower(scores.lower_section, key, roll)}
  }
}

export function slot_score(scores: PlayerScores, key: SlotKey): number | undefined {
  if (isUpperSlotKey(key))
      return scores.upper_section[key]
  else
    return scores.lower_section.scores[key]
}

export function sum(scores: PlayerScores): number | undefined {
  return sum_upper(scores.upper_section)
}

export function bonus(scores: PlayerScores): number | undefined {
  return (sum(scores) ?? 0) >= 63? 50 : 0
}

export function registered(scores: PlayerScores, key: SlotKey): boolean {
  return slot_score(scores, key) !== undefined
}

export function is_finished(scores: PlayerScores): boolean {
  return finished_upper(scores.upper_section) && finished_lower(scores.lower_section)
}

export function total_upper(scores: PlayerScores): number {
  return (sum(scores) ?? 0) + (bonus(scores) ?? 0)
}

export function total_lower(scores: PlayerScores): number {
  return lower_section_keys
    .map(k => scores.lower_section.scores[k] ?? 0)
    .reduce((a, b) => a + b , 0)
}

export function total(scores: PlayerScores) {
  return total_upper(scores) + total_lower(scores)
}
