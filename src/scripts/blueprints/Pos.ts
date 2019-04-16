import { Direction } from "./SugorokuMapGenerater"

export default class Pos {
  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public isEqual(pos: Pos): boolean {
    return this.x === pos.x && this.y === pos.y
  }

  public add(pos: Pos): void {
    this.x += pos.x
    this.y += pos.y
  }

  public addNew(pos: Pos): Pos {
    return new Pos(this.x + pos.x, this.y + pos.y)
  }

  public getSideTargetDiection(target: Pos) {
    if ((this.x - 1 === target.x) && (this.y === target.y)) {
      return Direction.West

    } else if ((this.x + 1  === target.x) && (this.y === target.y)) {
      return Direction.East

    } else if ((this.x === target.x) && (this.y - 1  === target.y)) {
      return Direction.North

    } else if ((this.x === target.x) && (this.y + 1 === target.y)) {
      return Direction.South

    } else {
      throw new Error('Target is not adjacent.')
    }
  }
}
