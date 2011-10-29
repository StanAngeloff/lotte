@base  'http://b-paid.dev'
@title 'Describe.js:'

@open '/', ->
  @group 'Github', ->
    @group 'Second Group', ->
      @describe 'Job 1', ->
        @assert.ok false
        @success()
      @group 'Third Group', ->
        @describe 'Job 2', ->
          @assert.ok(true)
          @success()
