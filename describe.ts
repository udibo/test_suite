import {
  DescribeDefinition,
  HookNames,
  ItDefinition,
  TestSuite,
} from "./test_suite.ts";
export type { DescribeDefinition, ItDefinition, TestSuite };

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

/** Registers an individual test case. */
function it<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  let { suite } = options;

  suite ??= TestSuite.current as TestSuite<T>;

  if (!TestSuite.started) TestSuite.started = true;
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
}

/** Registers an individual test case with only set to true. */
it.only = function itOnly<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  return it({
    ...options,
    only: true,
  });
};

/** Registers an individual test case with ignore set to true. */
it.ignore = function itIgnore<T>(...args: ItArgs<T>): void {
  const options = itDefinition(...args);
  return it({
    ...options,
    ignore: true,
  });
};

function addHook<T>(
  name: HookNames,
  fn: (context: T) => void | Promise<void>,
): void {
  if (!TestSuite.current) {
    if (TestSuite.started) {
      throw new Error(
        "cannot add global hooks after a global test is registered",
      );
    }
    TestSuite.current = new TestSuite({
      name: "global",
      [name]: fn,
    });
  } else {
    TestSuite.setHook(TestSuite.current!, name, fn);
  }
}

/** Run some shared setup before all of the tests in the suite. */
export function beforeAll<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("beforeAll", fn);
}

/** Run some shared teardown after all of the tests in the suite. */
export function afterAll<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("afterAll", fn);
}

/** Run some shared setup before each test in the suite. */
export function beforeEach<T>(
  fn: (context: T) => void | Promise<void>,
): void {
  addHook("beforeEach", fn);
}

/** Run some shared teardown after each test in the suite. */
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

/** Generates a DescribeDefinition from DescribeArgs. */
function describeDefinition<T>(
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
    suite = options.suite ?? TestSuite.current as TestSuite<T>;
  }

  return {
    ...options,
    suite,
    name,
    fn,
  };
}

/** Registers a test suite. */
function describe<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  if (!TestSuite.started) TestSuite.started = true;
  return new TestSuite(options);
}

/** Registers a test suite with only set to true. */
describe.only = function describeOnly<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    only: true,
  });
};

/** Registers a test suite with ignore set to true. */
describe.ignore = function describeIgnore<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  const options = describeDefinition(...args);
  return describe({
    ...options,
    ignore: true,
  });
};

export { describe, it };
