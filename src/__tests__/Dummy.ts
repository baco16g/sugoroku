import Dummy from 'modules/Dummy'

document.body.innerHTML = `
  <div id="root">Hello, World!</div>
`

/** @test {Dummy} */
describe('Dummy class', () => {
  it('should return innerHTML', () => {
    const dummy = new Dummy(document.getElementById('root')!, {})
    const expected = 'Hello, World!'

    expect(dummy.getInnerHtml(dummy.getElem())).toEqual(expected)
  })

  it('should return first letter', () => {
    const dummy = new Dummy(document.getElementById('root')!, { dummy_opt: 'dummy' })
    const expected = 'd'

    expect(dummy.getFirstLetter(dummy.getOpt('dummy_opt'))).toEqual(expected)
  })

  it('should throw error when value is not string', () => {
    const dummy = new Dummy(document.getElementById('root')!, { dummy_opt: false })

    expect(() => dummy.getFirstLetter(dummy.getOpt('dummy_opt'))).toThrowError('argument "false" is not string!')
  })
})