import { Vector } from "./deps/udibo/collections/vector.ts";

export interface TestDefinition<T> {
  /** The name of the test. */
  name: string;
  /** The test function. */
  fn:
    | (() => void)
    | (() => Promise<void>)
    | ((context: T) => void)
    | ((context: T) => Promise<void>);
  /**
   * The test suite that the test belongs to.
   * Any option that is not specified will be inherited from the test suite.
   */
  suite?: TestSuite<T>;
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

export interface TestSuiteDefinition<T> {
  /** The name of the test suite will be prepended to the names of tests in the suite. */
  name: string;
  /** The initial context for the test suite. */
  context?: Partial<T>;
  /**
   * The parent test suite that the test suite belongs to.
   * Any option that is not specified will be inherited from the parent test suite.
   */
  suite?: TestSuite<T> | TestSuite<Partial<T>>;
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
  /** Run some shared setup before each test in the suite. */
  beforeEach?:
    | (() => void)
    | (() => Promise<void>)
    | ((context: T) => void)
    | ((context: T) => Promise<void>);
  /** Run some shared teardown after each test in the suite. */
  afterEach?:
    | (() => void)
    | (() => Promise<void>)
    | ((context: T) => void)
    | ((context: T) => Promise<void>);
  /** Run some shared setup before all of the tests in the suite. */
  beforeAll?:
    | (() => void)
    | (() => Promise<void>)
    | ((context: T) => void)
    | ((context: T) => Promise<void>);
  /** Run some shared teardown after all of the tests in the suite. */
  afterAll?:
    | (() => void)
    | (() => Promise<void>)
    | ((context: T) => void)
    | ((context: T) => Promise<void>);
}

// deno-lint-ignore no-explicit-any
const suites: Vector<TestSuite<any>> = new Vector();
const suiteNames: Set<string> = new Set();
const testNames: Set<string> = new Set();

let initialized = false;
let started = false;

/**
 * A group of tests. A test suite can include child test suites.
 * The name of the test suite is prepended to the name of each test within it.
 * Tests belonging to a suite will inherit options from it.
 */
export class TestSuite<T> {
  /** The function used to register tests. Defaults to `Deno.test`. */
  static registerTest: (options: Deno.TestDefinition) => void = Deno.test;
  /**
   * Initializes global test suite. This should not be used in your tests.
   * This is used internally and for testing the test suite module.
   */
  static init(): void {
    if (initialized) throw new Error("global test suite already initialized");
    initialized = true;
    globalSuite = new TestSuite({
      name: "",
      beforeAll(): void {
        // deno-lint-ignore no-explicit-any
        const lastSuite: TestSuite<any> = suites.peekRight()!;
        for (const suite of suites.drainRight()) {
          suite.last = lastSuite.last;
          suite.locked = true;
        }
        started = true;
      },
    });
    suites.push(globalSuite);
  }
  /**
   * Resets global test suite. This should not be used in your tests.
   * This is used for testing the test suite module.
   */
  static reset(): void {
    suiteNames.clear();
    testNames.clear();
    suites.length = 0;
    globalSuite = null;
    initialized = false;
    started = false;
    TestSuite.init();
  }

  /** The name of the test suite will be prepended to the names of tests in the suite. */
  private name: string;
  /** The context for tests within the suite. */
  private context: Partial<T>;
  /**
   * The parent test suite that the test suite belongs to.
   * Any option that is not specified will be inherited from the parent test suite.
   */
  private suite?: TestSuite<T>;
  /** Ignore all tests in suite if set to true. */
  private ignore?: boolean;
  /**
   * If at least one test suite or test has only set to true,
   * only run test suites and tests that have only set to true.
   */
  private only?: boolean;
  /**
   * Check that the number of async completed ops after each test in the suite
   * is the same as the number of dispatched ops. Defaults to true.
   */
  private sanitizeOps?: boolean;
  /**
   * Ensure the test cases in the suite do not "leak" resources - ie. the resource table
   * after each test has exactly the same contents as before each test. Defaults to true.
   */
  private sanitizeResources?: boolean;
  /** Full name of the last test in the suite. */
  private last?: string;
  private started: boolean;
  private locked: boolean;

  /** Run some shared setup before all of the tests in the suite. */
  private beforeAll: () => Promise<void>;
  /** Run some shared teardown after all of the tests in the suite. */
  private afterAll: () => Promise<void>;
  /** Run some shared setup before each test in the suite. */
  private beforeEach: (context: T) => Promise<void>;
  /** Run some shared teardown after each test in the suite. */
  private afterEach: (context: T) => Promise<void>;

  constructor(private options: TestSuiteDefinition<T>) {
    if (typeof options.name !== "string") {
      throw new TypeError("name must be a string");
    } else if (options.name.length === 0) {
      if (globalSuite) throw new TypeError("name cannot be empty");
    } else if (
      options.name[0] === " " || options.name[options.name.length - 1] === " "
    ) {
      throw new TypeError("name cannot start or end with a space");
    }
    if (globalSuite) {
      this.suite = options.suite ?? globalSuite;
    } else if (options.suite) {
      this.suite = options.suite;
    }
    if (this.suite && this.suite.locked) {
      throw new Error("cannot add to test suite starting another test suite");
    }
    this.name = (this.suite && this.suite.name ? `${this.suite.name} ` : "") +
      options.name;
    if (suiteNames.has(this.name)) throw new Error("suite name alread used");
    suiteNames.add(this.name);

    if (!suites.isEmpty()) {
      // deno-lint-ignore no-explicit-any
      const lastSuite: TestSuite<any> = suites.peekRight()!;
      while (this.suite !== suites.peekRight() && !suites.isEmpty()) {
        // deno-lint-ignore no-explicit-any
        const completedSuite: TestSuite<any> = suites.pop()!;
        completedSuite.last = lastSuite.last;
        completedSuite.locked = true;
      }
    }
    suites.push(this);

    this.ignore = options.ignore ?? this.suite?.ignore;
    this.only = options.only ?? this.suite?.only;
    this.sanitizeOps = options.sanitizeOps ?? this.suite?.sanitizeOps;
    this.sanitizeResources = options.sanitizeResources ??
      this.suite?.sanitizeResources;

    this.beforeAll = async () => {
      if (this.suite) {
        await this.suite.beforeAll();
        this.context = { ...this.suite.context, ...this.context };
      }
      if (options.beforeAll) await options.beforeAll(this.context as T);
      this.started = true;
    };
    this.afterAll = async () => {
      if (options.afterAll) await options.afterAll(this.context as T);
      if (this.suite && this.suite.last === this.last) {
        await this.suite.afterAll();
      }
    };
    this.beforeEach = async (context: T) => {
      if (this.suite) await this.suite.beforeEach(context);
      if (options.beforeEach) await options.beforeEach(context);
    };
    this.afterEach = async (context: T) => {
      if (options.afterEach) await options.afterEach(context);
      if (this.suite) await this.suite.afterEach(context);
    };
    this.context = (options.context ?? {}) as T;
    this.started = false;
    this.locked = false;
  }

  /**
   * Register a test which will run when `deno test` is used on the command line
   * and the containing module looks like a test module.
   */
  static test<T>(
    name: string,
    fn:
      | (() => void)
      | (() => Promise<void>)
      | ((context: T) => void)
      | ((context: T) => Promise<void>),
  ): void;
  static test<T>(
    suite: TestSuite<T>,
    name: string,
    fn:
      | (() => void)
      | (() => Promise<void>)
      | ((context: T) => void)
      | ((context: T) => Promise<void>),
  ): void;
  static test<T>(options: TestDefinition<T>): void;
  static test<T>(
    a: string | TestDefinition<T> | TestSuite<T>,
    b?:
      | string
      | (() => void)
      | (() => Promise<void>)
      | ((context: T) => void)
      | ((context: T) => Promise<void>),
    c?:
      | (() => void)
      | (() => Promise<void>)
      | ((context: T) => void)
      | ((context: T) => Promise<void>),
  ): void {
    if (started) throw new Error("cannot add test after test runner started");
    const options: TestDefinition<T> =
      !(a instanceof TestSuite) && typeof a !== "string"
        ? a
        : typeof a === "string"
        ? { name: a, fn: b as (this: T) => (void | Promise<void>) }
        : {
          suite: a as TestSuite<T>,
          name: b as string,
          fn: c as (this: T) => (void | Promise<void>),
        };
    const suite: TestSuite<T> = options.suite ?? globalSuite!;
    if (suite.locked) {
      throw new Error("cannot add to test suite starting another test suite");
    }

    let name: string = options.name;
    if (typeof name !== "string") {
      throw new TypeError("name must be a string");
    } else if (name.length === 0) {
      throw new TypeError("name cannot be empty");
    } else if (name[0] === " " || name[name.length - 1] === " ") {
      throw new TypeError("name cannot start or end with a space");
    }

    const fn: (context: T) => Promise<void> = options
      .fn as ((context: T) => Promise<void>);
    if (!fn) throw new TypeError("fn argument or option missing");

    name = (suite.name ? `${suite.name} ` : "") + name;
    if (testNames.has(name)) throw new Error("test name already used");
    testNames.add(name);

    if (!suites.isEmpty()) {
      // deno-lint-ignore no-explicit-any
      const lastSuite: TestSuite<any> = suites.peekRight()!;
      while (suite !== suites.peekRight() && !suites.isEmpty()) {
        // deno-lint-ignore no-explicit-any
        const completedSuite: TestSuite<any> = suites.pop()!;
        completedSuite.last = lastSuite.last;
        completedSuite.locked = true;
      }
    }

    suite.last = name;
    const test: Deno.TestDefinition = {
      name,
      fn: async () => {
        if (!suite.started) await suite.beforeAll();
        const context: T = { ...suite.context } as T;
        try {
          await suite.beforeEach(context);
          await fn(context);
        } finally {
          try {
            await suite.afterEach(context);
          } finally {
            if (suite.last === name) await suite.afterAll();
          }
        }
      },
    };

    if (typeof options.ignore !== "undefined") test.ignore = options.ignore;
    else if (typeof suite.ignore !== "undefined") test.ignore = suite.ignore;

    if (typeof options.only !== "undefined") test.only = options.only;
    else if (typeof suite.only !== "undefined") test.only = suite.only;

    if (typeof options.sanitizeOps !== "undefined") {
      test.sanitizeOps = options.sanitizeOps;
    } else if (typeof suite.sanitizeOps !== "undefined") {
      test.sanitizeOps = suite.sanitizeOps;
    }

    if (typeof options.sanitizeResources !== "undefined") {
      test.sanitizeResources = options.sanitizeResources;
    } else if (typeof suite.sanitizeResources !== "undefined") {
      test.sanitizeResources = suite.sanitizeResources;
    }

    TestSuite.registerTest(test);
  }
}

/**
 * Register a test which will run when `deno test` is used on the command line
 * and the containing module looks like a test module.
 */
export const test: typeof TestSuite.test = TestSuite.test;

// deno-lint-ignore no-explicit-any
let globalSuite: TestSuite<any> | null = null;
TestSuite.init();
