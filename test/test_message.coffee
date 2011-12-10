@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/', 'message(..)', ->
  @describe 'should message server using events', ->
    @message 'hello', value = 'World', (response) ->
      @assert.equal response, "#{value}!"
      @success()
