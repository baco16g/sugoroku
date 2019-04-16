import randRange from '../utils/randRange'

export default class Dice {
  private history: number[]
  private min: number
  private max: number

  constructor(min: number, max: number) {
    this.history = []
    this.min = min
    this.max = max
  }

  public shake(): number {
    const n = randRange(this.min, this.max)
    this.history.push(n)
    return n
  }
}