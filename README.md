Lotte
=====

Lotte is a work-in-progress, headless, automated testing framework built on top of [PhantomJS][phantom].
Heavily inspired by [Ghostbuster][ghostbuster], it adds jQuery-like method chaining, more assertion logic and an extensible core.

Tests can be written in JavaScript or [CoffeeScript][coffee] depending on your preference.
New languages that can be [transpiled][transpile] to JavaScript can be added in the core if there is enough interest.

Tests are ran asynchronously and independently of each other. Each task within a test is also ran asynchronously where possible.
Blocking methods are provided to simulate dependencies and to control the flow of execution.

Lotte is written in JavaScript and can be extended easily by adding methods to built-in objects/classes.
Most of the everyday testing needs, e.g., mouse and keyboard input, are available out of the box.

Lotte is highly experimental. Using this software may cause your computer to blow up. [Seriously.][license]

  [ghostbuster]: https://github.com/joshbuddy/ghostbuster
  [phantom]:     http://www.phantomjs.org/
  [coffee]:      http://coffeescript.org/
  [transpile]:   https://twitter.com/#!/scottdavis99/status/65579423335854080
  [license]:     https://github.com/StanAngeloff/lotte/blob/master/LICENSE.md

Prerequisites
-------------

- [node.js][nodejs] **~0.4.10**
- [npm][npm] **~1.0**
- [PhantomJS][phantom] **~1.3.0**

  [npm]:       http://npmjs.org/
  [nodejs]:    http://nodejs.org/
  [phantom]:   http://www.phantomjs.org/

### Optional dependencies:

- [CoffeeScript][coffee]

You must also have `mktemp` available which is installed by default on Mac OS and most Linux distributions as part of GNU [coreutils][coreutils].

  [coffee]:    http://coffeescript.org/
  [coreutils]: http://www.gnu.org/software/coreutils/

Installation
------------

As there are no official releases available yet, your only option at present is to clone the Git repository and use [npm][npm] to link the project on your system:

```shell
$ git clone git://github.com/StanAngeloff/lotte.git
$ cd lotte
$ npm install
$ npm link .
```

If `npm install` fails to install one or more dependencies, remove the `node_modules` directory and re-run the command.

`npm link` will make the `lotte` script available from any directory given you have configured the `npm` binary path (`/usr/local/bin` by default) to be on your system `$PATH`.

  [npm]: http://npmjs.org/

Usage
-----

When you run the `lotte` script from a terminal:

- The current working directory is scanned recursively for files matching the glob `lotte_*.js` (continue reading for details on how to configure this pattern)
- Files are sorted and executed in order with at most 4 tests running at any given time
- As individual tests complete, results are printed on-screen. Once all tests have finished, the `lotte` process exits either with a non-zero code if there was at least one failure or with a zero exit code if all tests passed

Anatomy of a Test
-----------------

A very basic test file looks like this:

```coffeescript
@open 'http://local.dev/feature/action/page', 'optional description', ->
  @describe 'series of tests to verify XYZ', ->
    @$('h1').contains 'expects project name in heading', /\bLotte\b/
    @success()
```

Note all Lotte functions are prefixed with `this.` (`@` in CoffeeScript).

Each test file consists of:

- one or many `@open` blocks to specify the target URL of nested test cases
- one or many `@group` blocks to organise nested test cases
- one or many `@describe` blocks to create test cases
- one `@success` function call to mark the successful end of a test case

Writing Tests
-------------

### Global Context

The following functions are defined in the global context:

- `@title(title)`

    Give the test file a meaningful title.

    Example:

    ```coffeescript
    @title 'Sign up page'

    @open 'http://local.dev/signup', ->
      [...]
    ```

- `@base(uri)`

    When a URL is used anywhere in the test file without a protocol in it, the `uri` given will be prepended.

    Example:

    ```coffeescript
    @base 'http://local.dev'

    # The below URL does not contain a protocol and @base will be prepended.
    @open '/signup', ->
      [...]

    # The below URL contains a protocol and @base will be ignored.
    @open 'http://local-2.dev/login', ->
      [...]
    ```

- `@open(uri, [message], [options], block)`

    Creates a new request to `uri` and, if the server returns a valid response (2xx or 3xx), calls `block`.

    `message` is optional and can be used to attach a meaningful description to the `uri`.  
    `options` is optional and can contain a hash for Phantom. See [settings (object)][settings].

    Example:

    ```coffeescript
    @open 'http://local.dev/signup', 'Sign up without JavaScript', settings: javascriptEnabled: no, ->
      [...]
    ```

#### Example

The code below combines all functions:

```coffeescript
@base  'http://local.dev'
@title 'Sign up page'

@open 'http://local.dev/signup', 'Sign up without JavaScript', settings: javascriptEnabled: no, ->
  [...]
```

  [settings]: http://code.google.com/p/phantomjs/wiki/Interface#settings_(object)

------------------------------------------------------------------------------

This project is still a work-in-progress, please see the [test][test] directory for up-to-date examples.

  [test]: https://github.com/StanAngeloff/lotte/tree/master/test

------------------------------------------------------------------------------

By default when you invoke the `lotte` script it will look for a `Lottefile` which could provide additional arguments before the script continues.

The script then scans the given `PATH` for all files matching the configured `include` glob pattern.
The list is filtered if an `exclude` glob pattern is present.

The resulting list is then considered final and tests are queued and executed in the order of their filenames.
If concurrency is set to `1`, tests will run in a synchronous fashion.
Otherwise a new process is started for each test, up to the configured concurrency. As processes exit, new ones are started until the queue is emptied.

Command-Line Options
--------------------

Lotte can be configured either from the command-line or by using `Lottefile`s.
See `--help` for available options:

```shell
$ lotte --help

Usage: lotte [OPTION...] PATH

Command-line arguments are evaluated before any included files.

Report issues at https://github.com/StanAngeloff/lotte/issues.

Options:
  --help, -h        give this help page
  --version, -v     print program version
  --concurrent, -c  limit of files to run in parallel            [default: 4]
  --timeout, -t     timeout for individual files (in seconds)    [default: 30000]
  --include, -I     glob pattern to match files in PATH          [string]  [default: "**/lotte_*.js"]
  --exclude, -E     glob pattern to remove included files        [string]
  --lottefile, -f   look for 'lottefile' in PATH                 [string]  [default: "Lottefile"]
  --verify          verify PhantomJS version (expected ~1.3.0)   [boolean]  [default: true]
  --phantom         executable for PhantomJS                     [string]  [default: "phantomjs"]
  --coffee          executable for CofeeScript                   [string]  [default: "coffee"]
  --mktemp          executable to create unique temporary files  [string]  [default: "mktemp"]
```

Any of the arguments listed above can also be configured from a `Lottefile`, either in the current working directory or inside the `PATH` argument passed to `lotte`.

Use `--phantom` if your `phantomjs` binary is not on `$PATH`.

Use `--coffee` if your `coffee` binary is not on `$PATH`.  
Lotte does not come bundled with a compiler and it will shell-out to the system to generate the required JavaScript before a test is executed.

Contributing
------------

The goal of this project is to provide an awesome tool for web developers to test their websites/apps in their favourite language with minimum efforts.

As there are no releases made yet and things are still in a state of flux, a lot is likely to change before reaching a release milestone.

Commit and code reviews, ideas and wish-lists are welcomed.


### Copyright

> Copyright (c) 2011 Stan Angeloff. See [LICENSE.md](https://github.com/StanAngeloff/lotte/blob/master/LICENSE.md) for details.
