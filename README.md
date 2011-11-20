Lotte
=====

Lotte is a headless, automated testing framework built on top of [PhantomJS][phantom] and inspired by [Ghostbuster][ghostbuster].
It adds jQuery-like methods and chaining, more assertion logic and an extensible core.
Tests can be written in either JavaScript or [CoffeeScript][coffee].

Lotte comes with tools for accessing the DOM, evaluating arbitrary code, simulating mouse and keyboard input.

Tests are sandboxed and run asynchronously. Blocking methods are available to simulate dependencies and to control the flow of execution.

This project is still highly experimental. Using it may cause your computer to blow up. [Seriously.][license]

  [phantom]:     http://www.phantomjs.org/
  [ghostbuster]: https://github.com/joshbuddy/ghostbuster
  [coffee]:      http://coffeescript.org/
  [license]:     https://github.com/StanAngeloff/lotte/blob/master/LICENSE.md

Prerequisites
-------------

- [node.js][nodejs] **~0.4.10**
- [npm][npm] **~1.0**
- [PhantomJS][phantom] **~1.3.0**

  [npm]:       http://npmjs.org/
  [nodejs]:    http://nodejs.org/
  [phantom]:   http://www.phantomjs.org/

### Optional Dependencies

- [CoffeeScript][coffee]

  [coffee]:    http://coffeescript.org/

Installation
------------

    $ npm -g install lotte

`-g`lobal is preferred so you can run `lotte` from any directory.

Usage
-----

Create a new file `lotte_github.js` (preferably in an empty directory) and copy the following code:

```javascript
this.open('https://github.com', function() {
  this.describe('Sign Up button', function() {
    this.assert.ok(this.$('.signup-button').length, 'expects button to be in the DOM');
    this.success();
  });
});
```

Run `lotte` from within the directory and you should see the following output:

```
/tmp/lotte_github.js
  @ https://github.com
      ✓ Sign Up button
```

Command-Line Options
--------------------

You can customise many aspects of Lotte's behaviour either on the command-line on through `Lottefile`s. The following options are available:

```
$ lotte --help
Usage: lotte [OPTION...] PATH

Options:
  --help, -h        give this help page
  --version, -v     print program version
  --concurrent, -c  limit of files to run in parallel                       [default: 4]
  --timeout, -t     timeout for individual files (in milliseconds)          [default: 30000]
  --include, -I     glob pattern to match files in PATH          [string]   [default: "**/lotte_*.js"]
  --exclude, -E     glob pattern to remove included files        [string]
  --lottefile, -f   look for 'lottefile' in PATH                 [string]   [default: "Lottefile"]
  --verify          verify PhantomJS version (expected ~1.3.0)   [boolean]  [default: true]
  --phantom         executable for PhantomJS                     [string]   [default: "phantomjs"]
  --coffee          executable for CofeeScript                   [string]   [default: "coffee"]
  --mktemp          executable to create unique temporary files  [string]   [default: "mktemp"]
```

There are four key options you would want to customise while the rest should work with their defaults.

- **`--concurrent, -c`**

    If you have more than one test file in a directory, Lotte will attempt to run them in parallel (asynchronously).
    You can specify how many tests can be running at any given time through this option.

    If you want to run tests synchronously, specify a value of `1`.

- **`--timeout, -t`**

    Each test is expected to finish within a given period of time. If a test takes longer, it is interruped and recorded as failed.

    The default value is `30` seconds, but you should consider reducing it.

- **`--include, -I`  
  `--exclude, -E`**

    When you run `lotte` from any directory the script collects a list of all files in the current directory and all sub-directories.
    The list is reduced by running the `include` glob pattern and dropping any files that did not match.
    The list is then reduced further by running the `exclude` glob pattern and dropping any files that did match.
    The remaining list is sorted and considered final.

    You can specify these arguments more than once to create an array of include/exclude patterns.

### Lottefile

In order to avoid having to type the full `lotte` command-line each time, you can use `Lottefile`s to store your settings per project.

`Lottefile`s are regular JavaScript files where each global variable maps to a command-line option. For example, the following command:

```
$ lotte --include '**/*.coffee' --include '**/*.js' --concurrent 1 tests
```

can be stored in a `Lottefile` as this:

```javascript
path       = 'tests'
include    = ['**/*.coffee', '**/*.js']
concurrent = 1
```

Running `lotte` from the project directory will then read the `Lottefile` and scan the `tests` directory for all files matching `**/*.{coffee,js}`.

Writing Tests
-------------

Tests can be written in either JavaScript or CoffeeScript.
In the sections below substitute `@` with `this.` if you are using JavaScript.
Arguments wrapped in square brackets `[` and `]` are optional.
Arguments ending in `...` can be used more than once.

At the top-level, the following functions are available:

- **`@title([name])`**

    Gets or sets the test title.
    This is useful for giving meaningful names to your tests.

    When called with zero arguments, returns the current title or `undefined`.  
    When called with one argument, sets the title.

    If you don't explicitly specify a title, the filename will be used instead.

- **`@base([uri])`**

    Gets or sets the absolute URI for all relative URIs in the test.
    You can use this to specify the root URI for your project.

    When called with zero arguments, returns the current URI or `undefined`.  
    When called with one argument, sets the URI.

    If you don't explicitly specify an absolute URI, all calls to `@open` will expect an absolute URI instead.

- **`@open(uri, [message], [options], block)`**

    Creates a new test.

    `uri` can be either an absolute or relative URI (see above).  
    `message` is an optional description for the URI. If you don't specify it, Lotte will print the `uri` in the output instead.  
    `options` is an object hash to pass to PhantomJS. See [settings (object)][settings].  
    `block` is a function which is executed if the server returns a valid response (2xx or 3xx).

    If the server returns a 4xx or 5xx HTTP code instead, the test is recorded as failed.

    If you have more than one `@open` call at the top-level, they will be executed asynchronously.

  [settings]: http://code.google.com/p/phantomjs/wiki/Interface#settings_(object)

Putting it all together, a test file could look like this:

```coffeescript
@title 'Github'
@base  'https://github.com'

@open '/', 'the homepage', ->
  # ...body of test...
```

### Cases & Grouping

Once you have successfully requested an URI, you can start writing test cases against the page.

The following functions are available:

- **`@group(name, block)`**

    Groups the nested test cases. This is mainly for structuring the output Lotte prints.

    `name` is the name of the group.  
    `block` is a function which contains the nested test cases.

- **`@describe(name, block)`**

    Starts a new test case.

    `name` is the name of the test case.  
    `block` is a function which is executed and is expected to contain assertion logic.

Putting it all together a test file could now look like this:

```coffeescript
@title 'Github'
@base  'https://github.com'

@open '/', 'the homepage', ->
  @describe 'counter shows number of repositories', ->
    # ...assertion logic...
  @group 'Sign Up button', ->
    @describe 'is in place', ->
      # ...assertion logic...
    @describe 'takes you to /plans', ->
      # ...assertion logic...
```

#### Flow of Execution

Each test case is executed in the order in which it is defined:

```coffeescript
@describe 'I run first', ->
@describe 'I run second', ->
# etc.
```

If a test case contains an asynchronous function call, the next test case is executed without waiting for the function to finish:

```coffeescript
@describe 'I run first', ->
@describe 'I run second', ->
  setTimeout ( -> ), 2500
@describe 'I run third in parallel with second still running', ->
```

Be extremely careful when dealing with asynchronous function. For example, using `.click()` to follow an anchor could change the page while another test case is running.

If a test case fails, any remaining test cases are skipped:

```coffeescript
@describe 'I run first', ->
  throw 'Whoops!'
@describe 'I should run second, but I never will', ->
```

To simulate dependencies and control the flow of execution, you can use the following functions:

- **`@wait(name..., block)`**

    Blocks the current test case until all dependencies have finished (either passed or failed).

The earlier example can now be rewritten as follows to make it synchronous again:

```coffeescript
@describe 'I run first', ->
@describe 'I run second', ->
  setTimeout ( -> ), 2500
@describe 'I run third', ->
  @wait 'I run second', ->
    # ...assertion logic...
```

### Environments

Lotte uses PhantomJS to execute tests. While you may be writing tests in JavaScript and expect to be able to access the DOM of a page directly, this is not the case.

Each test file runs in its own sandboxed environment. Each page you request also runs in a sandbox.
You cannot access variables across environments, i.e., you cannot define a variable in your test file and access it within the page you have just requested:

```coffeescript
@open 'https://github.com', ->
  @describe 'Sandbox', ->
    val = 'value'
    # following line throws an exception
    console.log(@page.evaluate( -> return val))
    throw 'exit'
```

In the above code snippet `@page.evaluate` runs the function as if it were defined on the page you just requested, i.e, `github.com`.
In order to do so, PhantomJS serializes the function, but it does not include the context in which it was defined.
When the function is executed, `val` is missing in the new context causing it to throw an exception.

Another limitation of PhantomJS is the fact you cannot return complex types from the page.
Objects are serialized before they leave the page sandbox and unserialized back in the parent (test case) environment:

```coffeescript
@open 'https://github.com', ->
  @describe 'serialize/unserialize', ->
    h1 = @page.evaluate( -> return document.querySelector('h1'))
    # prints 'H1' correctly
    console.log h1.tagName
    # prints 'undefined' as functions cannot be serialized/unserialized
    console.log h1.focus
    throw 'exit'
```

#### Document Queries

To work around those limitations and to abstract the boilerplate needed to access the DOM of a page, Lotte comes with a jQuery-like query function:

- **`@$(selector)`**

    `selector` is a string containing a selector expression.

    Returns a `DocumentQuery` object.

The earlier example can now be rewritten as follows:

```coffeescript
@open 'https://github.com', ->
  @describe 'Document Queries', ->
    # prints 'H1' correctly
    console.log @$('h1').tagName
    # prints 'undefined'
    console.log @$('h1').focus
    throw 'exit'
```

##### Additional Methods

A `DocumentQuery` object has the following methods to deal with the DOM:

- **`DocumentQuery.prototype.attr([index], property)`**

    Gets the value of `property` for the element at `index`.

    The following code snippets are equivalent:

    ```coffeescript
    @$('h1').attr('tagName')
    @$('h1').tagName
    ```

    The direct property access always returns the property value for the first matched element.

    While you can use `attr(..)` to access any property, the direct access will only work with the following pre-defined list of properties: `action`, `alt`, `checked`, `className`, `clientHeight`, `clientLeft`, `clientTop`, `clientWidth`, `disabled`, `enctype`, `height`, `href`, `id`, `innerHTML`, `length`, `maxLength`, `media`, `method`, `name`, `nodeName`, `nodeValue`, `offsetHeight`, `offsetLeft`, `offsetTop`, `offsetWidth`, `options`, `outerHTML`, `outerText`, `readOnly`, `rel`, `scrollHeight`, `scrollLeft`, `scrollTop`, `scrollWidth`, `selectedIndex`, `size`, `src`, `style`, `tagName`, `target`, `textContent`, `title`, `type`, `value`, `width`.

- **`DocumentQuery.prototype.click([index], [message], [block])`**

    Clicks on the element at `index` and returns execution to the test case (i.e., asynchronous). This method can be used to simulate mouse input.

    `index` is the position of the element in the matched selector collection. If you omit this argument, the first element is assumed.  
    `message` is an optional message to display if something goes wrong, i.e., if no elements were matched.  
    `block` is an optional function to execute when the new page has loaded, i.e., when you follow an anchor.

    ```coffeescript
    @open 'https://github.com', ->
      @describe 'click(..)', ->
        # prints https://github.com/
        console.log('I am now on: ' + @page.evaluate( -> location.href))
        @$('.signup-button').click ->
          # prints https://github.com/plans
          console.log('I am now on: ' + @page.evaluate( -> location.href))
          throw 'exit'
    ```

- **`DocumentQuery.prototype.input(value, [index], [message])`**

    Inputs `value` in the element at `index`. This method can be used to simulate keyboard input.

    `value` is a string to input as if it were keyboard input.  
    `index` is the position of the element in the matched selector collection. If you omit this argument, the first element is assumed.  
    `message` is an optional message to display if something goes wrong, i.e., if no elements were matched.

    ```coffeescript
    @open 'http://www.google.com', ->
      @describe 'input(..)', ->
        @$('[name="q"]').input 'meaning of life'
        @$('input[type="submit"]').click ->
          console.log @$('#res').attr('innerText')
          throw 'exit'
    ```

See **DOM Assertions** below for additional methods.

### Assertions

Lotte comes with two types of assertion logic:

- Generic assertions
- DOM assertions

#### Generic Assertions

If you have used Node's built-in [assert][assert] module, these functions will be familiar:

- **`@assert.fail(actual, expected, message, operator)`**

    Throws an exception that displays the values for `actual` and `expected` separated by the provided `operator`.

- **`@assert.ok(value, message)`**

    Tests if `value` is a true value, it is equivalent to `@assert.equal(true, value, message)`.

- **`@assert.equal(actual, expected, message)`**

    Tests shallow, coercive equality with the equal comparison operator `==`.

- **`@assert.notEqual(actual, expected, message)`**

    Tests shallow, coercive non-equality with the not equal comparison operator `!=`.

- **`@assert.deepEqual(actual, expected, message)`**

    Tests for deep equality.

- **`@assert.notDeepEqual(actual, expected, message)`**

    Tests for any deep inequality.

- **`@assert.strictEqual(actual, expected, message)`**

    Tests strict equality, as determined by the strict equality operator `===`.

- **`@assert.notStrictEqua(actual, expected, message)`**

    Tests strict non-equality, as determined by the strict not equal operator `!==`.

- **`@assert.throws(block, error, message)`**

    Expects `block` to throw an error. `error` can be constructor, RegExp or validation function.

- **`@assert.doesNotThrow(block, error, message)`**

    Expects `block` not to throw an error, see `@assert.throws` for details.

- **`@assert.contains(actual, expected, message)`**

    Expects `actual` to contain `expected`. `expected` can be a string or a RegExp.

  [assert]: http://nodejs.org/docs/v0.6.0/api/assert.html

#### DOM Assertions

`DocumentQuery` (see above) comes with additional methods to deal with assertions:

- **`DocumentQuery.prototype.contains([message], pattern)`**

    Expects at least one of the matched elements to contain `pattern`. `pattern` can be a string or a RegExp.

- **`DocumentQuery.prototype.each([message], block)`**

    Tests if calling `block` on each matched element as an argument returns a true value.

- **`DocumentQuery.prototype.first([message], block)`**

    Tests if calling `block` with the first matched element as an argument returns a true value.

- **`DocumentQuery.prototype.last([message], block)`**

    Tests if calling `block` with the last matched element as an argument returns a true value.

- **`DocumentQuery.prototype.nth(index, [message], block)`**

    Tests if calling `block` with the element at `index` as an argument returns a true value.

A general note which applies to all functions above: you cannot access variables from scope within `block` (see **Environments**).

An example test file that performs DOM assertions could look like this:

```coffeescript
@open 'https://github.com', ->
  @describe 'Navigation and children have classes', ->
    @$('.nav').first   (element) -> element.classList.contains('logged_out')
    @$('.nav li').each (element) -> !! element.className
    throw 'exit'
```

Passing Tests
-------------

So far we have ended tests with `throw 'exit'`. To pass a test case, use the following functions:

- **`@success()`**

    Marks the test case as passed. You must call this once within each `@describe` block.

If you don't end a test case either by failing any of the asserts or calling `@success()`, the entire test file will hang until `timeout` is reached at which point it is recorded as failed.

FAQs
----

- **Q**: How can I log in before requesting a page?

    **A**: You can nest `@open(..)` functions to achieve this:

    ```coffeescript
    @base 'http://local.dev'
    @open '/login', ->
      @describe 'Log in', ->
        @$('.username').input 'admin'
        @$('.password').input 'password'
        @$('input[type="submit"]').click ->
          @success()
          @open '/account', ->
            @describe 'My Account', ->
              # ...assertion logic...
              @success()
    ```

- **Q**: Can I pass arguments to my tests?

    **A**: Yes. Use `--` on the command-line followed by the arguments:

    ```
    $ lotte -- arg1 arg2
    ```

    Arguments will be available in your test files as `phantom.args[..]`.

- **Q**: How can I see what PhantomJS 'sees'?

    **A**: Within the context of a test case (`@describe`), you can refer to `@page` which is the PhantomJS [WebPage][webpage] object.

    ```coffeescript
    @describe 'snapshot', ->
      @page.render 'home.png'
      @success()
    ```

- **Q**: I don't have `phantomjs`, `coffee`, and/or `mktemp` on `$PATH`.

    **A**: See `lotte --help` for information on how to specify a path to the missing binary. `mktemp` should be installed by default on Mac OS and most Linux distributions as part of GNU [coreutils][coreutils].

  [webpage]:   http://code.google.com/p/phantomjs/wiki/Interface#'_WebPage_'_Object
  [coreutils]: http://www.gnu.org/software/coreutils/

Contributing
------------

The goal of this project is to provide an awesome tool for developers to test their websites or apps in their favourite language with minimum effort.

Commit and code reviews, ideas and documentation improvements are welcomed.

### Copyright

> Copyright (c) 2011 Stan Angeloff. See [LICENSE.md](https://github.com/StanAngeloff/lotte/blob/master/LICENSE.md) for details.
