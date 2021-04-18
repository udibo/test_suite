import {
  test,
  TestDefinition,
  TestSuite,
  TestSuiteDefinition,
} from "./test_suite.ts";

export interface DescribeDefinition {
  /** The name of the test suite will be prepended to the names of tests in the fn. */
  name: string;
  /** The callback for the test suite. */
  fn: () => void;
  /** Ignore all tests in suite if set to true. */
  ignore?: boolean;
  /**
   * If at least one test suite or test has only set to true,
   * only run test suites and tests that have only set to true.
   */
  only?: boolean;
  /**
   * Check that the number of async completed ops after each test in the suite
   * is the same as the number of dispatched ops. Defaults to true.
   */
  sanitizeOps?: boolean;
  /**
   * Ensure the test cases in the suite do not "leak" resources - ie. the resource table
   * after each test has exactly the same contents as before each test. Defaults to true.
   */
  sanitizeResources?: boolean;
}

export interface ItDefinition {
  /** The name of the test. */
  name: string;
  /** The test function. */
  fn:
    | (() => void)
    | (() => Promise<void>);
  /** Ignore test if set to true. */
  ignore?: boolean;
  /**
   * If at least one test suite or test has only set to true,
   * only run test suites and tests that have only set to true.
   */
  only?: boolean;
  /**
   * Check that the number of async completed ops after the test is the same as
   * the number of dispatched ops after the test. Defaults to true.
   */
  sanitizeOps?: boolean;
  /**
   * Ensure the test case does not "leak" resources - ie. the resource table after the test
   * has exectly the same contents as before the test. Defaults to true.
   */
  sanitizeResources?: boolean;
}

interface Context {
  beforeEach: boolean;
  afterEach: boolean;
  beforeAll: boolean;
  afterAll: boolean;
}

const hooksLocked: boolean[] = [];
function areHooksLocked(): boolean {
  return hooksLocked[hooksLocked.length - 1] ?? false;
}
function lockHooks(): void {
  if (hooksLocked.length === 0) {
    throw new Error("cannot lock hooks on global context");
  }
  hooksLocked[hooksLocked.length - 1] = true;
}

let currentContext: Context | null = null;
let currentSuite: TestSuite<void> | null = null;

/**
 * A group of tests. A test suite can include child test suites.
 * The name of the test suite is prepended to the name of each test within it.
 * Tests belonging to a suite will inherit options from it.
 */
function describe(name: string, fn: () => void): void;
function describe(options: DescribeDefinition): void;
function describe(a: string | DescribeDefinition, fn?: () => void): void {
  let options: TestSuiteDefinition<void> | void;
  if (typeof a === "string") {
    options = { name: a };
  } else {
    fn = a.fn;
    options = { name: a.name };
    if (typeof a.ignore !== "undefined") options.ignore = a.ignore;
    if (typeof a.only !== "undefined") options.only = a.only;
    if (typeof a.sanitizeOps !== "undefined") {
      options.sanitizeOps = a.sanitizeOps;
    }
    if (typeof a.sanitizeResources !== "undefined") {
      options.sanitizeResources = a.sanitizeResources;
    }
  }
  const parent: TestSuite<void> | null = currentSuite;
  if (parent) options.suite = parent;
  const suite: TestSuite<void> = new TestSuite(options);

  const parentContext: Context | null = currentContext;
  currentContext = {
    beforeEach: false,
    afterEach: false,
    beforeAll: false,
    afterAll: false,
  };
  if (currentSuite) lockHooks();
  hooksLocked.push(false);
  currentSuite = suite;
  try {
    fn!();
  } finally {
    hooksLocked.pop();
    currentContext = parentContext;
    currentSuite = parent;
  }
}

export type FocusDescribeDefinition = Omit<
  DescribeDefinition,
  "ignore" | "only"
>;
function focusDescribe(
  ignore: boolean,
  only: boolean,
  a: string | FocusDescribeDefinition,
  fn?: () => void,
): void {
  let options: DescribeDefinition | void;
  if (typeof a === "string") {
    options = { name: a, fn: fn! };
  } else {
    options = { ...a };
  }
  options.ignore = ignore;
  options.only = only;
  describe(options);
}

/**
 * A focused group of tests. A test suite can include child test suites.
 * The name of the test suite is prepended to the name of each test within it.
 * Tests belonging to a suite will inherit options from it.
 */
function fdescribe(name: string, fn: () => void): void;
function fdescribe(options: FocusDescribeDefinition): void;
function fdescribe(a: string | FocusDescribeDefinition, fn?: () => void): void {
  focusDescribe(false, true, a, fn);
}

/**
 * An ignored group of tests. A test suite can include child test suites.
 * The name of the test suite is prepended to the name of each test within it.
 * Tests belonging to a suite will inherit options from it.
 */
function xdescribe(name: string, fn: () => void): void;
function xdescribe(options: FocusDescribeDefinition): void;
function xdescribe(a: string | FocusDescribeDefinition, fn?: () => void): void {
  focusDescribe(true, false, a, fn);
}

/**
 * Register a test which will run when `deno test` is used on the command line
 * and the containing module looks like a test module.
 */
function it(name: string, fn: () => void): void;
function it(options: ItDefinition): void;
function it(
  a: string | ItDefinition,
  fn?: (() => void) | (() => Promise<void>),
): void {
  if (currentSuite) lockHooks();
  let options: TestDefinition<void> | void;
  if (typeof a === "string") {
    options = { name: a, fn: fn! };
  } else {
    options = { name: a.name, fn: a.fn };
    if (typeof a.ignore !== "undefined") options.ignore = a.ignore;
    if (typeof a.only !== "undefined") options.only = a.only;
    if (typeof a.sanitizeOps !== "undefined") {
      options.sanitizeOps = a.sanitizeOps;
    }
    if (typeof a.sanitizeResources !== "undefined") {
      options.sanitizeResources = a.sanitizeResources;
    }
  }

  if (currentSuite) options.suite = currentSuite;
  test(options);
}

export type FocusItDefinition = Omit<ItDefinition, "ignore" | "only">;
function focusIt(
  ignore: boolean,
  only: boolean,
  a: string | FocusItDefinition,
  fn?: () => void,
): void {
  let options: ItDefinition | void;
  if (typeof a === "string") {
    options = { name: a, fn: fn! };
  } else {
    options = { ...a };
  }
  options.ignore = ignore;
  options.only = only;
  it(options);
}

/**
 * Register a focused test which will run when `deno test` is used on the command line
 * and the containing module looks like a test module.
 */
function fit(name: string, fn: () => void): void;
function fit(options: FocusItDefinition): void;
function fit(a: string | FocusItDefinition, fn?: () => void): void {
  focusIt(false, true, a, fn);
}

/**
 * Register an ignored test which will run when `deno test` is used on the command line
 * and the containing module looks like a test module.
 */
function xit(name: string, fn: () => void): void;
function xit(options: FocusItDefinition): void;
function xit(a: string | FocusItDefinition, fn?: () => void): void {
  focusIt(true, false, a, fn);
}

function setHook(
  key: "beforeEach" | "afterEach" | "beforeAll" | "afterAll",
  fn: (() => void) | (() => Promise<void>),
) {
  if (!currentSuite) throw new Error(`${key} not allowed globally`);
  if (areHooksLocked()) {
    throw new Error(
      `${key} must be called before child suites and tests in suite`,
    );
  }
  if (currentContext![key]) {
    throw new Error(`${key} already called for suite`);
  }
  currentContext![key] = true;
  const suite: TestSuite<void> = currentSuite;
  TestSuite.setHooks(suite, { [key]: fn });
}

/** Run some shared setup before each test in the suite. */
export function beforeEach(fn: (() => void) | (() => Promise<void>)): void {
  setHook("beforeEach", fn);
}

/** Run some shared teardown after each test in the suite. */
export function afterEach(fn: (() => void) | (() => Promise<void>)): void {
  setHook("afterEach", fn);
}

/** Run some shared setup before all of the tests in the suite. */
export function beforeAll(fn: (() => void) | (() => Promise<void>)): void {
  setHook("beforeAll", fn);
}

/** Run some shared teardown after all of the tests in the suite. */
export function afterAll(fn: (() => void) | (() => Promise<void>)): void {
  setHook("afterAll", fn);
}

export { describe, fdescribe, fit, it, xdescribe, xit };
