@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/input.html', 'input(..) evaluates correctly', ->
  @describe 'should access default values', ->
    @assert.equal @$('#box1').value, 'World', 'expects default value in first box'
    @assert.equal @$('#box2').value, 'Hello\nWorld!', 'expects default value in second box'
    @success()
  @describe 'should throw when attempting to set value directly', ->
    @assert.throws ( => @$('#box1').value = 'knock, knock!'), /^TypeError.*getter$/, "expects .value to be read-only"
    @success()
  @describe 'should input text', ->
    @$('#box1').input value = 'Who are you?'
    @assert.equal @$('#box1').value, value, 'expects value in first box to update'
    @$('#box2').input value = "I am\n'John Doe'."
    @assert.equal @$('#box2').value, value, 'expects value in second box to update'
    @success()
  @describe 'should read and input text', ->
    previous = @$('#box1').value
    @$('#box1')
      .input(value = "#{previous} I am John Doe.")
      .contains('expects previous value in first box to persist', previous)
    @assert.equal @$('#box1').value, value, 'expects value in first box to update'
    @success()
