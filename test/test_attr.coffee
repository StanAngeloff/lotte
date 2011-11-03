@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/attr.html', 'attr(..) evaluates correctly', ->
  @describe 'should access collection properties', ->
    @assert.equal @$('dt').attr('length'), 3, 'expects three terms'
    @success()
  @describe 'should access first element properties', ->
    @assert.equal @$('dt').attr('innerHTML'), 'Term 1', 'expects Term 1'
    @assert.equal @$('dd').attr('innerHTML'), 'Description 1', 'expects Description 1'
    @success()
  @describe 'can access any element properties', ->
    @assert.equal @$('dt').attr(1, 'innerHTML'), 'Term 2', 'expects Term 2'
    @assert.equal @$('dd').attr(2, 'innerHTML'), 'Description 3', 'expects Description 3'
    @assert.equal @$('dd').attr(99, 'innerHTML'), undefined, 'expects undefined for out-of-bounds index'
    @success()
  @describe 'property access accesses first element properties', ->
    @assert.equal @$('dt').title, 'Term 1', 'expects Term 1'
    @assert.equal @$('dd').innerHTML, 'Description 1', 'expects Description 1'
    @success()
  @describe 'passthru(..) can extend available properties', ->
    @assert.equal @$('p').custom, undefined, 'expects undefined property before proxying'
    @assert.equal @$('p').passthru('custom').custom, 'Custom Value', 'expects value to be available after proxying'
    @success()
