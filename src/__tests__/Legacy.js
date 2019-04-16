import Dummy from 'modules/Legacy'

document.body.innerHTML = `
  <div id="root">Hello, World!</div>
`

/** @test {Dummy} */
describe('Dummy class', () => {
  const dummy = new Dummy(document.getElementById('root'), {})

  it('should return innerHTML', () => {
    const expected = 'Hello, World!'

    expect(dummy.getInnerHtml(dummy.elem)).toEqual(expected)
  })
})