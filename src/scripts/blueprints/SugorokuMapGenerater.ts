import Pos from './Pos'

import randRange from '../utils/randRange'
import times from '../utils/times'


const CHANGE_PERCENT = 50
const BRANCH_PERCENT = 50

export default class SugorokuMapGenerater {
  public grid: ICell[][]
  public start: Pos
  public goal: Pos

  constructor(rowLength: number, columnLength: number) {
    const [grid, { start, goal }] = this.determineStartAndEnd(this.createGrid(rowLength, columnLength))
    this.grid = grid
    this.start = start
    this.goal = goal
    this.setRoute()
    this.setSelectableDirections()
  }

  private createGrid(rowLength: number, columnLength: number): ICell[][] {
    return Array.from(times(columnLength).keys()).map(i => Array.from(times(rowLength).keys()).map(j => ({
      type: CellType.Wall,
      index: [i, j],
      prev: null,
      selectableDirections: []
    } as ICell)))
  }

  private determineStartAndEnd(grid: ICell[][]): [ICell[][], { start: Pos, goal: Pos }] {
    let start: Pos
    let goal: Pos
    do {
      const randPos = () => new Pos(randRange(0, grid[0].length - 1), randRange(0, grid.length - 1))
      start = randPos()
      goal = randPos()
    } while (Math.max(Math.abs(start.x - goal.x), Math.abs(start.y - goal.y)) < 5)
    grid[start.x][start.y].type = CellType.Start
    grid[goal.x][goal.y].type = CellType.Goal
    return [grid, { start, goal }]
  }

  private setSelectableDirections(): void{
    this.deepenGrid(this.grid)
      .map(cell => {
        const pos = new Pos(cell.index[0], cell.index[1])
        const aroundPassage = this.hasSomeAround(this.grid, pos, CellType.Passage)

        // NOTE: スタート位置から進むことが可能な1方向を求める
        if (cell.type === CellType.Start) {
          if (aroundPassage[Direction.North]) {
            cell.selectableDirections = [Direction.North]
          } else if (aroundPassage[Direction.South]) {
            cell.selectableDirections = [Direction.South]
          } else if (aroundPassage[Direction.East]) {
            cell.selectableDirections = [Direction.East]
          } else if (aroundPassage[Direction.West]) {
            cell.selectableDirections = [Direction.West]
          }
          return cell
        }

        // NOTE: ブランチ位置から進むことが可能な1方向を求める
        if (cell.type === CellType.Branch) {
          const possibleDirections = [
            { key: Direction.North, value: aroundPassage[Direction.North] },
            { key: Direction.East, value: aroundPassage[Direction.East] },
            { key: Direction.South, value: aroundPassage[Direction.South] },
            { key: Direction.West, value: aroundPassage[Direction.West] }
          ].filter(o => o.value).map(o => o.key)
          cell.selectableDirections = [possibleDirections[randRange(0, possibleDirections.length - 1)]]
          return cell
        }

        return cell
      })
      .map(cell => {
        const pos = new Pos(cell.index[0], cell.index[1])
        if (!cell.prev) return cell // NOTE: CellTypeがPassage以外はnullなのでそのまま返す
        const prev = cell.prev

        cell.selectableDirections = this.getEnumValues(Direction).filter(direction => {
          const prevDireciton = pos.getSideTargetDiection(prev)
          if ((direction === prevDireciton)) return false
          const aroundPassage = this.hasSomeAround(this.grid, pos, CellType.Passage)
          const aroundGoal = this.hasSomeAround(this.grid, pos, CellType.Goal)
          const aroundBranch = this.hasSomeAround(this.grid, pos, CellType.Branch)

          // NOTE: 対象方向にPassageもしくはGoalがある場合、対象方向にBranchが存在し かつ 選択可能な方向が現在位置と同一である場合
          if (
            (direction === Direction.East && (aroundPassage[Direction.East] || aroundGoal[Direction.East] || (aroundBranch[Direction.East] && direction === this.grid[pos.x+1][pos.y].selectableDirections[0])))
            || (direction === Direction.West && (aroundPassage[Direction.West] || aroundGoal[Direction.West] || (aroundBranch[Direction.West] && direction === this.grid[pos.x-1][pos.y].selectableDirections[0])))
            || (direction === Direction.North && (aroundPassage[Direction.North] || aroundGoal[Direction.North] || (aroundBranch[Direction.North] && direction === this.grid[pos.x][pos.y-1].selectableDirections[0])))
            || (direction === Direction.South && (aroundPassage[Direction.South] || aroundGoal[Direction.South] || (aroundBranch[Direction.South] && direction === this.grid[pos.x][pos.y+1].selectableDirections[0])))
          ) return true

          return false
        })
        return cell
      })
  }

  private setRoute(): void {
    let count = 0
    let p: Pos
    let grid: ICell[][] = []

    do {

      if (++count > 1000) {
        alert('can not create a route.')
        break
      }
      grid = this.cloneGrid(this.grid)
      p = this.start
      let direction = this.selectDirection(grid, p)
      if (direction === null) break

      while(!p.isEqual(this.goal)) {
        const newStep = this.getNextPosAndDirection(grid, p, direction)
        if (!newStep) break
        const [newPos, newDirection] = newStep
        if(!newPos.isEqual(this.goal)) {
          grid[newPos.x][newPos.y].type = CellType.Passage
          grid[newPos.x][newPos.y].prev = new Pos(p.x, p.y)
        }
        p = newPos
        direction = newDirection
      }

    } while (!p.isEqual(this.goal))

    this.grid = grid
    this.createBranches(grid)
  }

  private getNextPosAndDirection(grid: ICell[][], p: Pos, direction: Direction): [Pos, Direction] |  null {
    let newPos = p.addNew(this.getNumberOfStepByDirection(direction))
    if (!this.canCreateCourse(grid, newPos, direction) || this.isChangeDirection()) {
      const newDirection = this.selectDirection(grid, p)
      if (newDirection === null) return null
      newPos = p.addNew(this.getNumberOfStepByDirection(newDirection))
      return [newPos, newDirection]
    } else {
      return [newPos, direction]
    }
  }

  private isChangeDirection(): boolean {
    return randRange(1,100) <= CHANGE_PERCENT
  }

  private selectDirection(grid: ICell[][], currentPos: Pos): Direction | null {
    const directions = this.getPossibleDirection(grid, currentPos)
    if (directions.length === 0) {
      window.console.error('Possible course to go is not found.')
      return null
    }
    return directions[randRange(0, directions.length - 1)]
  }

  private getPossibleDirection(grid: ICell[][], currentPos: Pos): Direction[] {
    return this.getEnumValues(Direction)
      .reduce((possibleList, direction) => {
        const newPos = currentPos.addNew(this.getNumberOfStepByDirection(direction))
        if (!this.canCreateCourse(grid, newPos, direction)) return possibleList
        return [...possibleList, direction]
      }, [])
  }

  private canCreateCourse(grid: ICell[][], pos: Pos, direction: Direction): boolean {
    const outOfView = (p: Pos) => p.x < 0 || p.x > grid[0].length - 1 || p.y < 0 || p.y > grid.length - 1
    const alreadyPassed = (p: Pos) => grid[p.x][p.y].type === CellType.Start || grid[p.x][p.y].type === CellType.Passage

    if (outOfView(pos) || alreadyPassed(pos)) return false

    return this.getEnumValues(Direction)
      .filter(d => d !== this.reverseDirection(direction))
      .every(aheadDirection => {
        const aheadStep = this.getNumberOfStepByDirection(+aheadDirection)
        const ahedPos = pos.addNew(aheadStep)
        return !outOfView(ahedPos) && !alreadyPassed(ahedPos)
      })
  }

  private createBranches(grid: ICell[][]): void {
    grid.map(row => row.filter(cell => cell.type === CellType.Wall))
      .map(row => row.filter(_ => randRange(1, 100) < BRANCH_PERCENT))
      .filter(row => row.length > 0)
      .reduce((sum, row) => [...sum, ...row], [])
      .filter(cell => {
        const [x, y] = cell.index
        return x !== 0 && x !== grid[0].length -1 && y !== 0 && y !== grid.length - 1
      })
      .filter(cell => {
        const pos = new Pos(cell.index[0], cell.index[1])
        const aroundPassage = this.hasSomeAround(grid, pos, CellType.Passage)
        return (
          ((aroundPassage[Direction.East] || aroundPassage[Direction.West]) && (!aroundPassage[Direction.North] && !aroundPassage[Direction.South])) ||
          ((aroundPassage[Direction.North] || aroundPassage[Direction.South]) && (!aroundPassage[Direction.East] && !aroundPassage[Direction.West]))
        )
      })
      .reduce<ICell[]>((filteredCells, cell) => {
        const [x, y] = cell.index
        const canMap = filteredCells.every(c => {
          const [ox, oy] = c.index
          return Math.abs(ox - x) > 2 && Math.abs(oy - y) > 2
        })
        return canMap ? [...filteredCells, cell] : filteredCells
      }, [])
      .forEach(cell => this.setBranch(grid, new Pos(cell.index[0], cell.index[1])))
  }

  private setBranch(grid: ICell[][], pos: Pos): void {
    const aroundPassage = this.hasSomeAround(grid, pos, CellType.Passage)
    if ((aroundPassage[Direction.North] && aroundPassage[Direction.South]) || (aroundPassage[Direction.East] && aroundPassage[Direction.West])) {
      grid[pos.x][pos.y].type = CellType.Branch
      return
    }
  }

  private hasSomeOnEast(grid: ICell[][], pos: Pos, type: CellType): boolean {
    const { x, y } = pos
    if (x+1 > this.grid[0].length - 1) return false
    return !!(grid[x+1][y].type === type)
  }
  private hasSomeOnWest(grid: ICell[][], pos: Pos, type: CellType): boolean {
    const { x, y } = pos
    if (x-1 < 0) return false
    return !!(grid[x-1][y].type === type)
  }
  private hasSomeOnNorth(grid: ICell[][], pos: Pos, type: CellType): boolean {
    const { x, y } = pos
    if (y-1 < 0) return false
    return !!(grid[x][y-1].type === type)
  }
  private hasSomeOnSouth(grid: ICell[][], pos: Pos, type: CellType): boolean {
    const { x, y } = pos
    if (y+1 > this.grid.length - 1) return false
    return !!(grid[x][y+1].type === type)
  }
  private hasSomeAround(grid: ICell[][], pos: Pos, type: CellType): { [Direction: number]: boolean } {
    return {
      [Direction.North]: this.hasSomeOnNorth(grid, pos, type),
      [Direction.East]: this.hasSomeOnEast(grid, pos, type),
      [Direction.South]: this.hasSomeOnSouth(grid, pos, type),
      [Direction.West]: this.hasSomeOnWest(grid, pos, type)
    }
  }

  private getNumberOfStepByDirection(direction: Direction): Pos {
    switch (direction) {
      case Direction.North:
        return new Pos(0, 1)
      case Direction.East:
        return new Pos(1, 0)
      case Direction.South:
        return new Pos(0, -1)
      case Direction.West:
        return new Pos(-1, 0)
      default:
        throw new Error('This direction is not defined.')
    }
  }

  private reverseDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.South
      case Direction.East:
        return Direction.West
      case Direction.South:
        return Direction.North
      case Direction.West:
        return Direction.East
      default:
        throw new Error('This direction is not defined.')
    }
  }

  private getEnumKeys(E: any) {
    return Object.keys(E).filter(k => typeof E[k as any] === "number")
  }

  private getEnumValues(E: any) {
    return this.getEnumKeys(E).map(k => E[k as any])
  }

  private cloneGrid(grid: ICell[][]): ICell[][] {
    return grid.map(row => row.map(cell => ({ ...cell })))
  }

  private deepenGrid(grid: ICell[][]): ICell[] {
    return grid.reduce((rows, row) => [...rows,...row], [])
  }
 }

enum CellType {
  Wall,
  Passage,
  Branch,
  Start,
  Goal
}

export enum Direction {
  North,
  East,
  South,
  West,
}

export interface ICell {
  type: CellType
  index: [number, number]
  prev: Pos | null
  selectableDirections: Direction[]
}
