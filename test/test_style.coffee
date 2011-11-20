@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/style.html', 'attr(..) works with styles', ->
  @describe 'inline style', ->
    @assert.contains @$('p').style.color, /^rgb\(\d+\D+\d+\D+\d+\)$/, 'expects rgb(..) sequence'
    @success()
  @describe 'inherited style', ->
    @assert.equal @$('small').style['text-transform'], 'lowercase', 'expects style from declaration to be applied'
    @success()
  @describe 'default style', ->
    @assert.equal @$('h1').style['font-weight'], 'bold', 'expects default style for headings to be bold'
    @success()
