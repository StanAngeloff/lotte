@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/', 'notify(..)', ->
  @describe 'should notify server using events', ->
    @notify 'hello', message = 'World', (response) ->
      @assert.equal response, "#{message}!"
      @success()
