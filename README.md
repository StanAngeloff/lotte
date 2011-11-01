Lotte
=====

Lotte is a work-in-progress, headless, automated testing framework built on top of [PhantomJS][phantom].
Heavily inspired by [Ghostbuster][ghostbuster], it adds jQuery-like method chaining, more assertion logic and an extensible core.

Tests can be written in both JavaScript and [CoffeeScript][coffee] depending on your preference.
New languages can be added in the core if there is enough interest.

Tests are ran asynchronously and independently of each other. Each task within a test is also ran asynchronously where possible.
Blocking methods are provided to simulate dependencies and to control the flow of execution.

Lotte is written in JavaScript itself and the core is easily extensible by adding new methods to built-in objects/classes.
Most of the everyday testing needs, e.g., mouse and keyboard input, will be available out of the box.

Lotte is highly experimental. Using this software may cause your computer to blow up. Seriously.

  [ghostbuster]: https://github.com/joshbuddy/ghostbuster
  [phantom]:     http://www.phantomjs.org/
  [coffee]:      http://coffeescript.org/

Installation
------------

As there are no releases available, your only option at this point is to clone the Git repository and use [npm][npm] to link the project globally on your system:

```bash
$ git clone git://github.com/StanAngeloff/lotte.git
$ cd lotte
$ npm link .
```

This will make the `lotte` script available from any directory (given you have configured the `npm` binary path to be on your `$PATH`).

  [npm]: http://npmjs.org/

Command-Line Options
--------------------

Lotte can be configured either from the command-line or by using `Lottefile`s.
See `--help` for available options:

```bash
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

Command-Line Usage
------------------

By default when you invoke the `lotte` script it will look for a `Lottefile` which could provide additional arguments before the script continues.

The script then scans the given `PATH` for all files matching the configured `include` glob pattern.
The list is filtered if an `exclude` glob pattern is present.

The resulting list is then considered final and tests are queued and executed in the order of their filenames.
If concurrency is set to `1`, tests will run in a synchronous fashion.
Otherwise a new process is started for each test, up to the configured concurrency. As processes exit, new ones are started until the queue is emptied.

Use `--phantom` if your `phantomjs` binary is not on `$PATH`.

The project is been developed and tested with PhantomJS installed from source and was not tested on the latest `1.3stable` release.

Writing Tests
-------------

This project is still a work-in-progress, please see the [test][test] directory for up-to-date examples.

### CoffeeScript

If you wish to write tests in CoffeeScript, you must have the `coffee` binary installed.
Lotte does not come bundled with a compiler and it will shell-out to the system to generate the required JavaScript before a test is executed.

Use `--coffee` if your `coffee` binary is not on `$PATH`.

  [test]: https://github.com/StanAngeloff/lotte/tree/master/test

Contributing
------------

The goal of this project is to provide an awesome tool for web developers to test their websites/apps in their favourite language with minimum efforts.

As there are no releases made yet and things are still in a state of flux, a lot is likely to change before reaching a release milestone.

Commit and code reviews, ideas and wish-lists are welcomed.


### Copyright

> Copyright (c) 2011 Stan Angeloff. See [LICENSE.md](https://github.com/StanAngeloff/lotte/blob/master/LICENSE.md) for details.
