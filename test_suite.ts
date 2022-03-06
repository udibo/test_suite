/** The options for creating a test suite with the describe function. */
export interface DescribeDefinition<T> extends Omit<Deno.TestDefinition, "fn"> {
  fn?: () => void;
  /**
   * The `describe` function returns a symbol representing the group of tests.
   * If `describe` is called within another `describe` calls `fn`, the suite will default to that parent `describe` calls returned symbol.
   * If `describe` is not called within another `describe` calls `fn`, the suite will default to the symbol representing the global group of tests.
   */
  suite?: symbol;
  /** Run some shared setup before all of the tests in the suite. */
  beforeAll?: (context: T) => void | Promise<void>;
  /** Run some shared teardown after all of the tests in the suite. */
  afterAll?: (context: T) => void | Promise<void>;
  /** Run some shared setup before each test in the suite. */
  beforeEach?: (context: T) => void | Promise<void>;
  /** Run some shared teardown after each test in the suite. */
  afterEach?: (context: T) => void | Promise<void>;
}

/** The options for creating an individual test case with the it function. */
export interface ItDefinition<T> extends Omit<Deno.TestDefinition, "fn"> {
  fn: (context: T) => void | Promise<void>;
  /**
   * The `describe` function returns a symbol representing the group of tests.
   * If `it` is called within a `describe` calls `fn`, the suite will default to that parent `describe` calls returned symbol.
   * If `it` is not called within a `describe` calls `fn`, the suite will default to the symbol representing the global group of tests.
   */
  suite?: symbol;
}

/** The names of all the different types of hooks. */
export type HookNames = "beforeAll" | "afterAll" | "beforeEach" | "afterEach";

/** Optional test definition keys. */
const optionalTestDefinitionKeys: (keyof Deno.TestDefinition)[] = [
  "only",
  "permissions",
  "ignore",
  "sanitizeExit",
  "sanitizeOps",
  "sanitizeResources",
];

/** Optional test step definition keys. */
const optionalTestStepDefinitionKeys: (keyof Deno.TestStepDefinition)[] = [
  "ignore",
  "sanitizeExit",
  "sanitizeOps",
  "sanitizeResources",
];

/**
 * A group of tests. A test suite can include child test suites.
 */
export class TestSuite<T> {
  symbol: symbol;
  protected describe: DescribeDefinition<T>;
  protected steps: (TestSuite<T> | ItDefinition<T>)[];
  protected hasOnlyStep: boolean;

  constructor(describe: DescribeDefinition<T>) {
    this.describe = describe;
    this.steps = [];
    this.hasOnlyStep = false;

    const suite = describe.suite ?? TestSuite.current?.symbol;
    if (suite && !TestSuite.suites.has(suite)) {
      throw new Error("suite symbol does not represent a test suite");
    }
    this.symbol = Symbol();
    TestSuite.suites.set(this.symbol, this);
    const testSuite = suite && TestSuite.suites.get(suite);

    const { fn } = describe;
    if (fn) {
      const temp = TestSuite.current;
      TestSuite.current = this;
      try {
        fn();
      } finally {
        TestSuite.current = temp;
      }
    }

    if (testSuite) {
      TestSuite.addStep(testSuite, this);
    } else {
      const {
        name,
        ignore,
        only,
        permissions,
        sanitizeExit,
        sanitizeOps,
        sanitizeResources,
      } = describe;
      TestSuite.registerTest({
        name,
        ignore,
        only,
        permissions,
        sanitizeExit,
        sanitizeOps,
        sanitizeResources,
        fn: async (t) => {
          if (!TestSuite.running) TestSuite.running = true;
          const context = {} as T;
          if (this.describe.beforeAll) {
            await this.describe.beforeAll(context);
          }
          try {
            TestSuite.active.push(this.symbol);
            await TestSuite.run(this, context, t);
          } finally {
            TestSuite.active.pop();
            if (this.describe.afterAll) {
              await this.describe.afterAll(context);
            }
          }
        },
      });
    }
  }

  /** If the test cases have begun executing. */
  static running = false;

  /** If a test has been registered yet. Block adding global hooks if a test has been registered. */
  static started = false;

  /** A map of all test suites by symbol. */
  // deno-lint-ignore no-explicit-any
  static suites = new Map<symbol, TestSuite<any>>();

  /** The current test suite being registered. */
  // deno-lint-ignore no-explicit-any
  static current: TestSuite<any> | null = null;

  /** The stack of tests that are actively running. */
  static active: symbol[] = [];

  /** This is used internally for testing this module. */
  static reset(): void {
    TestSuite.running = false;
    TestSuite.started = false;
    TestSuite.current = null;
    TestSuite.active = [];
  }

  /** This is used internally to register tests. */
  static registerTest(options: Deno.TestDefinition): void {
    options = { ...options };
    optionalTestDefinitionKeys.forEach((key) => {
      if (typeof options[key] === "undefined") delete options[key];
    });
    Deno.test(options);
  }

  /** Updates all steps within top level suite to have ignore set to true if only is not set to true on step. */
  static addingOnlyStep<T>(suite: TestSuite<T>) {
    if (!suite.hasOnlyStep) {
      for (let i = 0; i < suite.steps.length; i++) {
        const step = suite.steps[i]!;
        if (step instanceof TestSuite) {
          if (!(step.hasOnlyStep || step.describe.only)) {
            suite.steps.splice(i--, 1);
          }
        } else {
          if (!step.only) {
            suite.steps.splice(i--, 1);
          }
        }
      }
      suite.hasOnlyStep = true;
    }
  }

  /** This is used internally to add steps to a test suite. */
  static addStep<T>(
    suite: TestSuite<T>,
    step: TestSuite<T> | ItDefinition<T>,
  ): void {
    if (!suite.hasOnlyStep) {
      if (step instanceof TestSuite) {
        if (step.hasOnlyStep || step.describe.only) {
          TestSuite.addingOnlyStep(suite);
        }
      } else {
        if (step.only) TestSuite.addingOnlyStep(suite);
      }
    }

    let omit = false;
    if (suite.hasOnlyStep) {
      if (step instanceof TestSuite) {
        if (!(step.hasOnlyStep || step.describe.only)) omit = true;
      } else {
        if (!step.only) omit = true;
      }
    }

    if (!omit) suite.steps.push(step);
  }

  /** This is used internally to add hooks to a test suite. */
  static setHook<T>(
    suite: TestSuite<T>,
    name: HookNames,
    fn: (context: T) => void | Promise<void>,
  ): void {
    if (suite.describe[name]) {
      throw new Error(`${name} hook already set for test suite`);
    }
    suite.describe[name] = fn;
  }

  /** This is used internally to run all steps for a test suite. */
  static async run<T>(
    suite: TestSuite<T>,
    context: T,
    t: Deno.TestContext,
  ): Promise<void> {
    for (const step of suite.steps) {
      const {
        name,
        fn,
        ignore,
        permissions,
        sanitizeExit,
        sanitizeOps,
        sanitizeResources,
      } = step instanceof TestSuite ? step.describe : step;

      const options: Deno.TestStepDefinition = {
        name,
        ignore,
        sanitizeExit,
        sanitizeOps,
        sanitizeResources,
        fn: async (t) => {
          if (permissions) {
            throw new Error(
              "permissions option not available for nested tests",
            );
          }
          context = { ...context };
          if (step instanceof TestSuite) {
            if (step.describe.beforeAll) {
              await step.describe.beforeAll(context);
            }
            try {
              TestSuite.active.push(step.symbol);
              await TestSuite.run(step, context, t);
            } finally {
              TestSuite.active.pop();
              if (step.describe.afterAll) {
                await step.describe.afterAll(context);
              }
            }
          } else {
            await TestSuite.runTest(fn!, context);
          }
        },
      };
      optionalTestStepDefinitionKeys.forEach((key) => {
        if (typeof options[key] === "undefined") delete options[key];
      });
      await t.step(options);
    }
  }

  static async runTest<T>(
    fn: (context: T) => void | Promise<void>,
    context: T,
    activeIndex = 0,
  ) {
    const suite = TestSuite.active[activeIndex];
    const testSuite = suite && TestSuite.suites.get(suite);
    if (testSuite) {
      context = { ...context };
      if (testSuite.describe.beforeEach) {
        await testSuite.describe.beforeEach(context);
      }
      try {
        await TestSuite.runTest(fn, context, activeIndex + 1);
      } finally {
        if (testSuite.describe.afterEach) {
          await testSuite.describe.afterEach(context);
        }
      }
    } else {
      await fn(context);
    }
  }
}
