import Dice from '../blueprints/Dice'
import Pos from '../blueprints/Pos'
import SugorokuMapGenerater, { Direction, ICell } from '../blueprints/SugorokuMapGenerater'
import sleep from '../utils/sleep'

export default class SugorokuMap {
  private elem: HTMLElement
  private diceElem: HTMLButtonElement
  private dice: Dice
  private currentPos: Pos
  private map: IBlock[][]
  private mapGenerater: SugorokuMapGenerater

  constructor(elem: HTMLElement, opts: IOpts) {
    this.elem = elem
    this.diceElem = document.createElement('button')
    this.dice = new Dice(1, 6)
    this.mapGenerater = new SugorokuMapGenerater(opts.mapWidth/opts.blockWidth, opts.mapHeight/opts.blockHeight)
    this.currentPos = this.mapGenerater.start
    this.map = this.extendsCell(this.mapGenerater.grid, opts.blockWidth, opts.blockHeight)
    this.map.forEach(row => row.forEach(block => this.drawMap(block)))
    this.drawDice()
    this.bindEvents()
  }

  private bindEvents(): void {
    this.diceElem.addEventListener('click', this.onShakeDice.bind(this))
  }

  private async onShakeDice(): Promise<void> {
    let n = this.dice.shake()
    window.alert(n)
    while (n > 0) {
      await sleep(200)
      const direction = this.checkDirectionToGo()
      if (direction === null) {
        n = 0
      } else {
        this.goForward(direction)
      }
      n--
    }
  }

  private checkDirectionToGo(): Direction | null {
    const { x, y } = this.currentPos

    if (this.currentPos.isEqual(this.mapGenerater.goal)) {
      window.alert('ゴール！')
      return null
    }
    const currentCell = this.map.reduce<IBlock[]>((rows, row) => [...rows, ...row], [])
      .find(cell => {
        const [tx, ty] = cell.index
        return x === tx && y === ty
      })
    if (!currentCell) throw new Error('current cell is not found.')

    const { selectableDirections } = currentCell
    if (selectableDirections.length === 0) {
      throw new Error('There is no direction to go.')
    } else if (selectableDirections.length === 1) {
      return selectableDirections[0]
    } else {
      window.alert('複数の経路が存在します。')
      const selectedDirection = selectableDirections.find(direction => window.confirm(`${this.getEnumKeys(Direction)[direction]}に進みますか？`))
      if (!selectedDirection) {
        window.alert('1つも経路が選択されませんでした。リセットします。')
        document.location.reload()
        return null
      }
      return selectedDirection
    }
  }

  private goForward(direction: Direction) {
    this.clearPassage(this.currentPos)
    switch (direction) {
      case Direction.North:
        this.currentPos.y--
        break
      case Direction.East:
        this.currentPos.x++
        break
      case Direction.South:
        this.currentPos.y++
        break
      case Direction.West:
        this.currentPos.x--
        break
      default:
        throw new Error('This direction is not defined.')
    }
    this.onPassage(this.currentPos)
  }

  private extendsCell(map: SugorokuMapGenerater['grid'], blockWidth: number, blockHeight: number): IBlock[][] {
    return map.map((row, i) => row.map((block, j) => ({
      x: i * blockWidth,
      y: j * blockHeight,
      width: blockWidth,
      height: blockHeight,
      ...block,
    })))
  }

  private drawMap(block: IBlock): void {
    const { x, y, width, height, type, index } = block
    const pos = new Pos(index[0], index[1])
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    cell.setAttribute('data-coordinate', `${pos.x}-${pos.y}`)
    cell.setAttribute('x', x.toString())
    cell.setAttribute('y', y.toString())
    cell.setAttribute('width', width.toString())
    cell.setAttribute('height', height.toString())
    cell.style.fill = ['#000', '#fff', '#ffff00', '#ff0000', '#000fff'][type]
    cell.style.stroke = '#333'
    g.appendChild(cell)
    g.addEventListener('click', () => {
      window.console.log(block.selectableDirections)
    })
    this.elem.appendChild(g)
  }

  private onPassage(pos: Pos): void {
    const elem = this.elem.querySelector(`[data-coordinate="${pos.x}-${pos.y}"]`) as HTMLElement
    elem.style.fill = '#ff0000'
  }
  private clearPassage(pos: Pos): void {
    const elem = this.elem.querySelector(`[data-coordinate="${pos.x}-${pos.y}"]`) as HTMLElement
    elem.style.fill = '#fff'
  }

  private drawDice(): void {
    this.diceElem.style.position = 'fixed'
    this.diceElem.style.right = '10px'
    this.diceElem.style.top = '10px'
    this.diceElem.textContent = 'サイコロ'
    document.body.appendChild(this.diceElem)
  }

  private getEnumKeys(E: any) {
    return Object.keys(E).filter(k => typeof E[k as any] === "number")
  }
}

interface IOpts {
  mapWidth: number
  mapHeight: number
  blockWidth: number
  blockHeight: number
  margin: number
}

interface IBlock extends ICell {
  width: number
  height: number
  x: number
  y: number
}