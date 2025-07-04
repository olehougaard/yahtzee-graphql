import { die_values, DieArray } from './dice'
import { lower_section_slots, slots, Roll, SlotKey } from './yahtzee.slots'

type UpperSection = Readonly<DieArray<number | undefined>>

type LowerSectionSlots = typeof lower_section_slots

type LowerSectionKey = keyof LowerSectionSlots

type LowerSection = Readonly<Partial<Record<LowerSectionKey, number>>>

export type PlayerScoresMemento = UpperSection & LowerSection

const lower_section_keys: Readonly<LowerSectionKey[]> = Object.keys(lower_section_slots) as LowerSectionKey[]

export const slot_keys: Readonly<SlotKey[]> = Object.keys(slots) as SlotKey[]

function upper_section(): UpperSection {
  return Object.fromEntries(die_values.map(v => [v, undefined])) as DieArray<undefined>
}

export function lower_section(): LowerSection {
  return { }
}


export function new_scores_memento(): PlayerScoresMemento {
  return { ...upper_section(), ...lower_section() }
}

export function register(scores: PlayerScoresMemento, key: SlotKey, roll: Roll): PlayerScoresMemento {
  return { ...scores, [key]: slots[key].score(roll) }
}

export function slot_score(scores: PlayerScoresMemento, key: SlotKey): number | undefined {
  return scores[key]
}

export function sum(scores: DieArray<number | undefined>): number {
  return die_values
    .map(key => scores[key] ?? 0)
    .reduce((s, v) => s + v, 0)
}

export function bonus(scores: PlayerScoresMemento): number | undefined {
  return sum(scores) >= 63? 50 : 0
}

export function registered(scores: PlayerScoresMemento, key: SlotKey): boolean {
  return slot_score(scores, key) !== undefined
}

export function is_finished(scores: PlayerScoresMemento): boolean {
  return slot_keys.map(k => scores[k]).every(s => s !== undefined)
}

export function total_upper(scores: PlayerScoresMemento): number {
  return (sum(scores) ?? 0) + (bonus(scores) ?? 0)
}

export function total_lower(scores: PlayerScoresMemento): number {
  return lower_section_keys
  .map(key => scores[key] ?? 0)
    .reduce((s, v) => s + v , 0)
}

export function total(scores: PlayerScoresMemento) {
  return total_upper(scores) + total_lower(scores)
}
