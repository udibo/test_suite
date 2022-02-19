import { Vector } from "./deps.ts";

export interface DescribeDefinition<T> extends Omit<Deno.TestDefinition, "fn"> {
  fn?: () => void;
  /**
   * The `describe` function returns a `TestSuite` representing the group of tests.
   * If `describe` is called within another `describe` calls `fn`, the suite will default to that parent `describe` calls returned `TestSuite`.
   * If `describe` is not called within another `describe` calls `fn`, the suite will default to the global `TestSuite`.
   */
  suite?: TestSuite<T>;
  /** Run some shared setup before all of the tests in the suite. */
  beforeAll?: (context: T) => void | Promise<void>;
  /** Run some shared teardown after all of the tests in the suite. */
  afterAll?: (context: T) => void | Promise<void>;
  /** Run some shared setup before each test in the suite. */
  beforeEach?: (context: T) => void | Promise<void>;
  /** Run some shared teardown after each test in the suite. */
  afterEach?: (context: T) => void | Promise<void>;
}

export interface ItDefinition<T> extends Omit<Deno.TestDefinition, "fn"> {
  fn: (context: T) => void | Promise<void>;
  /**
   * The `describe` function returns a `TestSuite` representing the group of tests.
   * If `it` is called within a `describe` calls `fn`, the suite will default to that parent `describe` calls returned `TestSuite`.
   * If `it` is not called within a `describe` calls `fn`, the suite will default to the global `TestSuite`.
   */
  suite?: TestSuite<T>;
}

/** If a test has been registered yet. Block adding global hooks if a test has been registered. */
let started = false;

/** The names of all the different types of hooks. */
type HookNames = "beforeAll" | "afterAll" | "beforeEach" | "afterEach";

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
  protected describe: DescribeDefinition<T>;
  protected steps: Vector<TestSuite<T> | ItDefinition<T>>;
  protected hasOnlyStep: boolean;
  protected context?: T;

  constructor(describe: DescribeDefinition<T>) {
    this.describe = describe;
    this.steps = new Vector();
    this.hasOnlyStep = false;

    if (describe.suite) {
      describe.suite.steps.push(this);
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
          const context = {} as T;
          if (this.describe.beforeAll) {
            this.describe.beforeAll(context);
          }
          try {
            activeTestSuites.push(this);
            await TestSuite.run(this, context, t);
          } finally {
            activeTestSuites.pop();
            if (this.describe.afterAll) {
              this.describe.afterAll(context);
            }
          }
        },
      });
    }

    const { fn } = describe;
    if (fn) {
      const temp = currentTestSuite;
      currentTestSuite = this;
      try {
        fn();
      } finally {
        currentTestSuite = temp;
      }
    }
  }

  /** This is used internally for testing this module. */
  static reset(): void {
    started = false;
    currentTestSuite = null;
  }

  /** This is used internally to register tests. */
  static registerTest(options: Deno.TestDefinition): void {
    options = { ...options };
    optionalTestDefinitionKeys.forEach((key) => {
      if (typeof options[key] === "undefined") delete options[key];
    });
    Deno.test(options);
    if (!started) started = true;
  }

  /** This is used internally to add steps to a test suite. */
  static addStep<T>(
    suite: TestSuite<T>,
    step: TestSuite<T> | ItDefinition<T>,
  ): void {
    suite.steps.push(step);
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
        only,
        permissions,
        sanitizeExit,
        sanitizeOps,
        sanitizeResources,
      } = step instanceof TestSuite ? step.describe : step;

      only;
      // if suite.hasOnlyStep, ignore steps without only or describe.only?
      // need to figure out how to get only working

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
              step.describe.beforeAll(context);
            }
            try {
              activeTestSuites.push(step);
              await TestSuite.run(step, context, t);
            } finally {
              activeTestSuites.pop();
              if (step.describe.afterAll) {
                step.describe.afterAll(context);
              }
            }
          } else {
            await TestSuite.runTest(fn!, context, activeTestSuites.values());
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
    activeTestSuites: IterableIterator<TestSuite<T>>,
  ) {
    const suite: TestSuite<T> = activeTestSuites.next().value;
    if (suite) {
      context = { ...context };
      if (suite.describe.beforeEach) {
        suite.describe.beforeEach(context);
      }
      try {
        await TestSuite.runTest(fn, context, activeTestSuites);
      } finally {
        if (suite.describe.afterEach) {
          suite.describe.afterEach(context);
        }
      }
    } else {
      await fn(context);
    }
  }
}

// deno-lint-ignore no-explicit-any
let currentTestSuite: TestSuite<any> | null = null;
// deno-lint-ignore no-explicit-any
const activeTestSuites: Vector<TestSuite<any>> = new Vector();

/** The arguments for an ItFunction. */
type ItArgs<T> =
  | [options: ItDefinition<T>]
  | [
    name: string,
    options: Omit<ItDefinition<T>, "name">,
  ]
  | [
    name: string,
    fn: (context: T) => void | Promise<void>,
  ]
  | [fn: (context: T) => void | Promise<void>]
  | [
    name: string,
    options: Omit<ItDefinition<T>, "fn" | "name">,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    options: Omit<ItDefinition<T>, "fn">,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    options: Omit<ItDefinition<T>, "fn" | "name">,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<ItDefinition<T>, "name" | "suite">,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<ItDefinition<T>, "fn" | "name" | "suite">,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<ItDefinition<T>, "fn" | "suite">,
    fn: (context: T) => void | Promise<void>,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<ItDefinition<T>, "fn" | "name" | "suite">,
    fn: (context: T) => void | Promise<void>,
  ];

/** Registers an individual test case with only set to true. */
export interface ItOnlyFunction {
  <T>(...args: ItArgs<T>): void;
}

/** Registers an individual test case with ignore set to true. */
export interface ItIgnoreFunction {
  <T>(...args: ItArgs<T>): void;
}

/** Registers an individual test case. */
export interface ItFunction {
  <T>(...args: ItArgs<T>): void;

  /** Registers an individual test case with only set to true. */
  only: ItOnlyFunction;

  /** Registers an individual test case with ignore set to true. */
  ignore: ItIgnoreFunction;
}

/** Generates an ItDefinition from ItArgs. */
function itDefinition<T>(...args: ItArgs<T>): ItDefinition<T> {
  let [
    suiteOptionsOrNameOrFn,
    optionsOrNameOrFn,
    optionsOrFn,
    fn,
  ] = args;
  let suite: TestSuite<T> | undefined = undefined;
  let name: string;
  let options:
    | ItDefinition<T>
    | Omit<ItDefinition<T>, "fn">
    | Omit<ItDefinition<T>, "name">
    | Omit<ItDefinition<T>, "fn" | "name">;
  if (suiteOptionsOrNameOrFn instanceof TestSuite) {
    suite = suiteOptionsOrNameOrFn;
  } else {
    fn = optionsOrFn as typeof fn;
    optionsOrFn = optionsOrNameOrFn as typeof optionsOrFn;
    optionsOrNameOrFn = suiteOptionsOrNameOrFn as typeof optionsOrNameOrFn;
  }
  if (typeof optionsOrNameOrFn === "string") {
    name = optionsOrNameOrFn;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
      options = {};
    } else {
      options = optionsOrFn!;
      if (!fn) fn = (options as Omit<ItDefinition<T>, "name">).fn;
    }
  } else if (typeof optionsOrNameOrFn === "function") {
    fn = optionsOrNameOrFn;
    name = fn.name;
    options = {};
  } else {
    options = optionsOrNameOrFn!;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
    } else {
      fn = (options as ItDefinition<T>).fn;
    }
    name = (options as ItDefinition<T>).name ?? fn.name;
  }

  return {
    suite,
    ...options,
    name,
    fn,
  };
}

export const it = function it<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  let { suite } = options;

  suite ??= currentTestSuite as TestSuite<T>;

  if (suite) {
    TestSuite.addStep(suite, options);
  } else {
    const {
      name,
      fn,
      ignore,
      only,
      permissions,
      sanitizeExit,
      sanitizeOps,
      sanitizeResources,
    } = options;
    TestSuite.registerTest({
      name,
      ignore,
      only,
      permissions,
      sanitizeExit,
      sanitizeOps,
      sanitizeResources,
      fn: async () => {
        await fn!({} as T);
      },
    });
  }
} as ItFunction;

it.only = function itOnly<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  return it({
    ...options,
    only: true,
  });
} as ItOnlyFunction;

it.ignore = function itIgnore<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  return it({
    ...options,
    ignore: true,
  });
} as ItIgnoreFunction;

function addHook<T>(
  name: HookNames,
  fn: (context: T) => void | Promise<void>,
): void {
  if (!started) {
    currentTestSuite = new TestSuite({
      name: "global",
      [name]: fn,
    });
  } else if (!currentTestSuite) {
    throw new Error(
      "cannot add global hooks after a global test is registered",
    );
  } else {
    TestSuite.setHook(currentTestSuite!, name, fn);
  }
}

export function beforeAll<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("beforeAll", fn);
}

export function afterAll<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("afterAll", fn);
}

export function beforeEach<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("beforeEach", fn);
}

export function afterEach<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("afterEach", fn);
}

/** The arguments for a DescribeFunction. */
type DescribeArgs<T> =
  | [options: DescribeDefinition<T>]
  | [name: string]
  | [
    name: string,
    options: Omit<DescribeDefinition<T>, "name">,
  ]
  | [name: string, fn: () => void]
  | [fn: () => void]
  | [
    name: string,
    options: Omit<DescribeDefinition<T>, "fn" | "name">,
    fn: () => void,
  ]
  | [
    options: Omit<DescribeDefinition<T>, "fn">,
    fn: () => void,
  ]
  | [
    options: Omit<DescribeDefinition<T>, "fn" | "name">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<DescribeDefinition<T>, "name" | "suite">,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    name: string,
    options: Omit<DescribeDefinition<T>, "fn" | "name" | "suite">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<DescribeDefinition<T>, "fn" | "suite">,
    fn: () => void,
  ]
  | [
    suite: TestSuite<T>,
    options: Omit<DescribeDefinition<T>, "fn" | "name" | "suite">,
    fn: () => void,
  ];

/** Registers a test suite with only set to true. */
export interface DescribeOnlyFunction {
  <T>(...args: DescribeArgs<T>): TestSuite<T>;
}

/** Registers a test suite with ignore set to true. */
export interface DescribeIgnoreFunction {
  <T>(...args: DescribeArgs<T>): TestSuite<T>;
}

/** Registers a test suite. */
export interface DescribeFunction {
  <T>(...args: DescribeArgs<T>): TestSuite<T>;

  /** Registers a test suite with only set to true. */
  only: DescribeOnlyFunction;

  /** Registers a test suite with ignore set to true. */
  ignore: DescribeIgnoreFunction;
}

/** Generates a DescribeDefinition from DescribeArgs. */
export function describeDefinition<T>(
  ...args: DescribeArgs<T>
): DescribeDefinition<T> {
  let [
    suiteOptionsOrNameOrFn,
    optionsOrNameOrFn,
    optionsOrFn,
    fn,
  ] = args;
  let suite: TestSuite<T> | undefined = undefined;
  let name: string;
  let options:
    | DescribeDefinition<T>
    | Omit<DescribeDefinition<T>, "fn">
    | Omit<DescribeDefinition<T>, "name">
    | Omit<DescribeDefinition<T>, "fn" | "name">;
  if (suiteOptionsOrNameOrFn instanceof TestSuite) {
    suite = suiteOptionsOrNameOrFn;
  } else {
    fn = optionsOrFn as typeof fn;
    optionsOrFn = optionsOrNameOrFn as typeof optionsOrFn;
    optionsOrNameOrFn = suiteOptionsOrNameOrFn as typeof optionsOrNameOrFn;
  }
  if (typeof optionsOrNameOrFn === "string") {
    name = optionsOrNameOrFn;
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
      options = {};
    } else {
      options = optionsOrFn ?? {};
      if (!fn) fn = (options as Omit<DescribeDefinition<T>, "name">).fn;
    }
  } else if (typeof optionsOrNameOrFn === "function") {
    fn = optionsOrNameOrFn;
    name = fn.name;
    options = {};
  } else {
    options = optionsOrNameOrFn ?? {};
    if (typeof optionsOrFn === "function") {
      fn = optionsOrFn;
    } else {
      fn = (options as DescribeDefinition<T>).fn;
    }
    name = (options as DescribeDefinition<T>).name ?? fn?.name ?? "";
  }

  if (!suite) {
    suite = options.suite ?? currentTestSuite as TestSuite<T>;
  }

  return {
    ...options,
    suite,
    name,
    fn,
  };
}

export const describe = function describe<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return new TestSuite(options);
} as DescribeFunction;

describe.only = function describeOnly<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    only: true,
  });
} as DescribeOnlyFunction;

describe.ignore = function describeIgnore<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    ignore: true,
  });
} as DescribeIgnoreFunction;
