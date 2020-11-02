# Test Suite

[![version](https://img.shields.io/badge/release-v0.6.1-success)](https://github.com/udibo/test_suite/tree/v0.6.1)
[![deno doc](https://img.shields.io/badge/deno-doc-success?logo=deno)](https://doc.deno.land/https/deno.land/x/test_suite@v0.6.1/mod.ts)
[![deno version](https://img.shields.io/badge/deno-v1.5.1-success?logo=deno)](https://github.com/denoland/deno/tree/v1.5.1)
[![CI](https://github.com/udibo/mock/workflows/CI/badge.svg)](https://github.com/udibo/test_suite/actions?query=workflow%3ACI)
[![license](https://img.shields.io/github/license/udibo/test_suite)](https://github.com/udibo/test_suite/blob/master/LICENSE)

This module extends Deno's built-in test runner to add setup/teardown hooks
and the ability to organize tests.

## Features

- Ability to group tests together into test suites
- Setup/teardown hooks for test suites(beforeAll, afterAll, beforeEach, afterEach)
- Tests within a test suite inherit configuration options

## Installation

To include this module in a Deno project, you can import directly from the TS files.
This module is available in Deno's third part module registry
but can also be imported directly from GitHub using raw content URLs.

```ts
// Import from Deno's third party module registry
import { TestSuite, test } from "https://deno.land/x/test_suite@v0.6.1/mod.ts";
// Import from GitHub
import { TestSuite, test } "https://raw.githubusercontent.com/udibo/test_suite/v0.6.1/mod.ts";
```

## Usage

Below are some examples of how to use TestSuite and test in tests.

See [deno docs](https://doc.deno.land/https/deno.land/x/test_suite@v0.6.1/mod.ts) for more information.

### TestSuite

When you have a set of tests that are related, you can group them together by creating a test suite.
A test suite can contain other test suites and tests.
All tests within a suite will inherit their options from the suite unless they specifically set them.

The beforeAll and afterAll hook options can be used to do something before and after all the tests in the suite run. If you would like to set values for all tests within the suite, you can create a context interface that defines all the values available to the tests that are defined in the beforeAll function.

The beforeEach and afterEach hook options are similar to beforeAll and afterAll except they are called before and after each individual test.

The example test below can be found in the example directory.

```ts
import { TestSuite, test } from "https://deno.land/x/test_suite@v0.6.1/mod.ts";
import { assertEquals } from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { User, getUser, resetUsers } from "./example/user.ts";

interface UserSuiteContext {
  user: User;
}
const userSuite: TestSuite<UserSuiteContext> = new TestSuite({
  name: "user",
  beforeEach(context: UserSuiteContext) {
    context.user = new User("Kyle June");
  },
  afterEach() {
    resetUsers();
  },
});

test(userSuite, "create", () => {
  const user = new User("John Doe");
  assertEquals(user.name, "John Doe");
});

const getUserSuite: TestSuite<UserSuiteContext> = new TestSuite({
  name: "getUser",
  suite: userSuite,
});

test(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

test(getUserSuite, "user exists", (context: UserSuiteContext) => {
  assertEquals(getUser("Kyle June"), context.user);
});

test(userSuite, "resetUsers", (context: UserSuiteContext) => {
  assertEquals(getUser("Kyle June"), context.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
```

If you run the above tests using `deno test`, you will get the following output.
Each test name is prefixed with the suite name.

```sh
$ deno test
running 4 tests
test user create ... ok (4ms)
test user getUser user does not exist ... ok (1ms)
test user getUser user exists ... ok (2ms)
test user resetUsers ... ok (2ms)

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out (11ms)
```

## License

[MIT](LICENSE)
