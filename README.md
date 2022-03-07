# Test Suite

[![version](https://img.shields.io/badge/release-0.12.0-success)](https://deno.land/x/test_suite@0.12.0)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/test_suite@0.12.0/mod.ts)
[![CI](https://github.com/udibo/test_suite/workflows/CI/badge.svg)](https://github.com/udibo/test_suite/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/udibo/test_suite/branch/main/graph/badge.svg?token=EFKGY72AAV)](https://codecov.io/gh/udibo/test_suite)
[![license](https://img.shields.io/github/license/udibo/test_suite)](https://github.com/udibo/test_suite/blob/master/LICENSE)

An extension of Deno's built-in test runner to add setup/teardown hooks and make
it easier to organize tests in a format similar to Jasmine, Jest, and Mocha.

## Features

- Ability to group tests together into test suites
- Setup/teardown hooks for test suites (beforeAll, afterAll, beforeEach,
  afterEach)
- Tests within a test suite inherit configuration options
- describe/it functions similar to Jasmine, Jest, and Mocha
- shorthand for focusing and ignoring tests

## Installation

To include this module in a Deno project, you can import directly from the TS
files. This module is available in Deno's third part module registry but can
also be imported directly from GitHub using raw content URLs.

```ts
// Import from Deno's third party module registry
import { describe, it } from "https://deno.land/x/test_suite@0.12.0/mod.ts";
// Import from GitHub
import {
  describe,
  it,
} from "https://raw.githubusercontent.com/udibo/test_suite/0.12.0/mod.ts";
```

## Usage

When you have a set of tests that are related, you can group them together by
creating a test suite. A test suite can contain other test suites and tests. All
tests within a suite will inherit their options from the suite unless they
specifically set them.

The beforeAll and afterAll hook options can be used to do something before and
after all the tests in the suite run. If you would like to set values for all
tests within the suite, you can create a context interface that defines all the
values available to the tests that are defined in the beforeAll function.

The beforeEach and afterEach hook options are similar to beforeAll and afterAll
except they are called before and after each individual test.

Below are some examples of how to use `describe` and `it` in tests.

See
[deno docs](https://doc.deno.land/https/deno.land/x/test_suite@0.12.0/mod.ts)
for more information.

### Nested test grouping

The example below can be found [here](examples/user_nested_test.ts).

```ts
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/x/test_suite@0.12.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import {
  getUser,
  resetUsers,
  User,
} from "https://deno.land/x/test_suite@0.12.0/examples/user.ts";

describe("user describe", () => {
  let user: User;

  beforeEach(() => {
    user = new User("Kyle June");
  });

  afterEach(() => {
    resetUsers();
  });

  it("create", () => {
    const user = new User("John Doe");
    assertEquals(user.name, "John Doe");
  });

  describe("getUser", () => {
    it("user does not exist", () => {
      assertEquals(getUser("John Doe"), undefined);
    });

    it("user exists", () => {
      assertEquals(getUser("Kyle June"), user);
    });
  });

  it("resetUsers", () => {
    assertEquals(getUser("Kyle June"), user);
    resetUsers();
    assertEquals(getUser("Kyle June"), undefined);
  });
});
```

If you run the above tests using `deno test`, you will get the following output.

```sh
$ deno test
running 1 test from file:///examples/user_nested_test.ts
test user describe ...
  test create ... ok (4ms)
  test getUser ...
    test user does not exist ... ok (4ms)
    test user exists ... ok (3ms)
  ok (11ms)
  test resetUsers ... ok (3ms)
ok (24ms)

test result: ok. 1 passed (5 steps); 0 failed; 0 ignored; 0 measured; 0 filtered out (43ms)
```

### Flat test grouping

The example below can be found [here](examples/user_flat_test.ts).

```ts
import { describe, it } from "https://deno.land/x/test_suite@0.12.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import {
  getUser,
  resetUsers,
  User,
} from "https://deno.land/x/test_suite@0.12.0/examples/user.ts";

interface UserContext {
  user: User;
}

const userSuite = describe({
  name: "user",
  beforeEach(context: UserContext) {
    context.user = new User("Kyle June");
  },
  afterEach() {
    resetUsers();
  },
});

it(userSuite, "create", () => {
  const user = new User("John Doe");
  assertEquals(user.name, "John Doe");
});

const getUserSuite = describe({
  name: "getUser",
  suite: userSuite,
});

it(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

it(getUserSuite, "user exists", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
});

it(userSuite, "resetUsers", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
```

If you run the above tests using `deno test`, you will get the following output.

```sh
$ deno test
running 1 test from file:///examples/user_flat_test.ts
test user ...
  test create ... ok (3ms)
  test getUser ...
    test user does not exist ... ok (2ms)
    test user exists ... ok (4ms)
  ok (11ms)
  test resetUsers ... ok (3ms)
ok (22ms)

test result: ok. 1 passed (5 steps); 0 failed; 0 ignored; 0 measured; 0 filtered out (44ms)
```

### Shorthand for focusing and ignoring tests

To avoid having to change your test function arguments to be able to focus or
ignore tests temporarily, a shorthand has been implemented. This makes it as
easy as typing `.only` and `.ignore` to focus and ignore tests.

- To focus a test case, replace `it` with `it.only`.
- To ignore a test case, replace `it` with `it.ignore`.
- To focus a test suite, replace `describe` with `describe.only`.
- To ignore a test suite, replace `describe` with `describe.ignore`.

### Migrating from earlier versions

The `TestSuite` class has been turned into an internal only class. To create a
test suite, use the `describe` function instead of creating a new instance of
`TestSuite` directly.

The `test` function has been removed. Replace `test` calls with calls to `it`.

The `each` function that was previously available has been temporarily removed
to allow me to switch over to the test step api quicker. I plan on implementing
this later. If you make use of the `each` function for generating test cases, do
not upgrade beyond version 0.9.5.

## License

[MIT](LICENSE)
