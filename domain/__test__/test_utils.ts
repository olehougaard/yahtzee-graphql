import { Randomizer } from "../src/utils/random_utils"

export const non_random = (...numbers: number[]): Randomizer => {
  let index = 0
  return (bound) => {
      const n = numbers[index]
      index = (index + 1) % numbers.length
      return n % bound
  }
}

