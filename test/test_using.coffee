@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/', 'using(..)', ->
  @describe 'should export variables across environments', ->
    value = 'argument names can be omitted'
    @assert.equal value, @page.evaluate @using { value }, -> value
    value = 'arguments are still available when function signature is different'
    @assert.equal value, @page.evaluate @using { value }, (x, y, z) -> value
    @success()
  @describe 'should export complex types', ->
    object = { hello: [false, value = 'World!'] }
    @assert.equal value, @page.evaluate @using { object }, -> object.hello.pop()
    @success()
  @describe 'should work with assertions', ->
    html = @$('h1').innerHTML
    @$('h1').first @using { html }, (element) -> element.innerHTML is html
    @success()
