@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/secret', 'attempts without authentication details', ->
  @describe 'should fail', ->
    @assert.contains @page.content, 'Authentication required', 'expects authentication required response'
    @success()

@open '/secret', 'attempts with wrong authentication details', settings: userName: 'wrong', password: 'password', ->
  @describe 'should fail', ->
    @assert.contains @page.content, 'Authentication required', 'expects authentication required response'
    @success()

@open '/secret', 'attempts with agreed authentication details', settings: userName: 'secret', password: 'password', ->
  @describe 'should succeed', ->
    @assert.contains @page.content, 'OK', 'expects authenticated response'
    @success()
