@base  'http://' + phantom.args[0] + ':' + phantom.args[1]
@title 'localhost.localdomain'

@open '/page1.html', 'click(..) follows', ->
  @describe 'should follow anchors', ->
    @$('h1').contains 'expects Page 1 in heading', /\bpage 1\b/i
    @$('a').click ->
      @$('h1').contains 'expects Page 2 in heading', /\bpage 2\b/i
      @success()
  @describe 'wait(..) blocks until dependencies met', ->
    @wait 'should follow anchors', ->
      @$('h1').contains 'expects Page 2 in heading', /\bpage 2\b/i
      @$('a').click ->
        @$('h1').contains 'expects Page 1 in heading', /\bpage 1\b/i
        @success()
