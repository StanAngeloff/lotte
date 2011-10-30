@base  'http://local.dev'
@title 'local.dev'

@open '/signup', 'Sign Up', ->
  @describe 'Referral and company tick boxes exist', ->
    @$('[name="has-referral"]').first 'expect referral tick box', (element) -> element.type is 'checkbox'
    @$('[name="has-company"]').first 'expect company tick box',   (element) -> element.type is 'checkbox'
    @success()
  @describe 'Company name and ID boxes exist', ->
    @$('[name="referral"]').first 'expect referral input box',    (element) -> element.type is 'text'
    @$('[name="company"]').first 'expect company name input box', (element) -> element.type is 'text'
    @$('[name="company_id"]').first 'expect ID input box',        (element) -> element.type is 'text'
    @success()
  @describe 'Company name and ID are mandatory only when selected', ->
    @assert.equal(@$('a').length, 12)
    @$('[name="has-company"]').first 'expect company tick box to be unselected', (element) -> not element.checked
    @$('[name="company"], [name="company_id"]').each 'no errors on start up',    (element) -> not element.classList.contains('with-error')
    @$('[name="apply"]').click()
    @$('[name="company"], [name="company_id"]').each 'no errors when option not selected', (element) -> not element.classList.contains('with-error')
    @$('[name="has-company"]').click()
    @$('[name="apply"]').click()
    @$('[name="company"], [name="company_id"]').each 'expect errors when option selected and submitted', (element) -> element.classList.contains('with-error')
    @success()
