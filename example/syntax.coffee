@base  'http://local.dev'
@title 'local.dev'

@open '/signup', 'Sign Up', ->
  @describe 'Referral and company tick boxes exist', ->
    @$('[name="has-referral"]', 'expect referral tick box').first (element) -> element.type is 'checkbox'
    @$('[name="has-company"]', 'expect company tick box').first   (element) -> element.type is 'checkbox'
    @success()
  @describe 'Company name and ID boxes exist', ->
    @$('[name="referral"]', 'expect referral input box').first    (element) -> element.type is 'text'
    @$('[name="company"]', 'expect company name input box').first (element) -> element.type is 'text'
    @$('[name="company_id"]', 'expect ID input box').first        (element) -> element.type is 'text'
    @success()
  @describe 'Company name and ID are mandatory only when selected', ->
    @$('[name="has-company"]', 'expect company tick box to be unselected').first (element) -> not element.checked
    @$('[name="company"], [name="company_id"]', 'no errors on start up').every   (element) -> not element.classList.contains('with-error')
    @$('[name="apply"]').click()
    @$('[name="company"], [name="company_id"]', 'no errors when option not selected').every (element) -> not element.classList.contains('with-error')
    @$('[name="has-company"]').click()
    @$('[name="apply"]').click()
    @$('[name="company"], [name="company_id"]', 'expect errors when option selected and submitted').every (element) -> element.classList.contains('with-error')
    @success()
