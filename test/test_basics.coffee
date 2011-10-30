@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/', 'basics', ->
  @describe 'html(..) supports regular expressions', ->
    @assert.ok @$('h1').length, 'expects a <h1> to be in the DOM'
    @$('h1').html 'expects project name in heading', /\bLotte\b/
    @success()
  @describe 'each(..) iterates over all elements', ->
    @assert.equal @$('p').length, 2, 'expects two paragraphs'
    @$('p').each "expects a 'class' attribute", (element) -> element.className
    @success()
  @describe 'first(..) evaluates correctly', ->
    @assert.equal @$('li').length, 3, 'expects three list items'
    @$('li').first "expects first list item to contain '1'", (element) -> element.innerHTML is '1'
    @success()
  @describe 'nth(..) evaluates correctly', ->
    @$('li').nth 1, "expects second list item to contain '2'", (element) -> element.innerHTML is '2'
    @success()
  @describe 'last(..) evaluates correctly', ->
    @$('li').last "expects last list item to contain '3'", (element) -> element.innerHTML is '3'
    @success()
  @describe 'click(..) sends events correctly', ->
    @$('button')
      .html('expects button to be in inital state', 'Click me!')
      .click()
      .html('expects button to be in final state', 'You clicked me!')
    @success()
