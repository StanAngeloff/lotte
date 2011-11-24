@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/secret', 'attempts with agreed authentication details', settings: userName: 'secret', password: 'password', ->
  @describe 'should succeed', ->
    @assert.contains @page.content, 'OK', 'expects authenticated response'
    @success()
