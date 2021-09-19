import {
  assertEquals,
  AssertionError,
  assertObjectMatch,
  assertThrows,
  assertThrowsAsync,
  delay,
} from "./deps.ts";
import { Spy, spy, Stub, stub } from "./test_deps.ts";
import { test, TestDefinition, TestSuite } from "./test_suite.ts";

function testDefinition(
  options: Deno.TestDefinition,
): Partial<Deno.TestDefinition> {
  const rslt: Partial<Deno.TestDefinition> = { ...options };
  delete rslt.fn;
  return rslt;
}

Deno.test("global tests no options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    test("global test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "global test 1" },
    );

    test("global test 2", testSpys[1]);
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "global test 2" },
    );

    test({
      name: "global test 3",
      fn: testSpys[2],
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "global test 3" },
    );

    test({
      name: "global test 4",
      fn: testSpys[3],
    });
    assertEquals(registerTestStub.calls.length, 4);
    assertEquals(registerTestStub.calls[3].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[3].args[0]),
      { name: "global test 4" },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);

    assertEquals(testSpys[2].calls.length, 0);
    await registerTestStub.calls[2].args[0].fn();
    assertEquals(testSpys[2].calls.length, 1);
    assertEquals(testSpys[2].calls[0].args, [{}]);

    assertEquals(testSpys[3].calls.length, 0);
    await registerTestStub.calls[3].args[0].fn();
    assertEquals(testSpys[3].calls.length, 1);
    assertEquals(testSpys[3].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("global tests with options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    test({
      name: "global test 1",
      fn: testSpys[0],
      ignore: false,
      only: false,
      sanitizeOps: false,
      sanitizeResources: false,
      sanitizeExit: false,
    });
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      {
        name: "global test 1",
        ignore: false,
        only: false,
        sanitizeOps: false,
        sanitizeResources: false,
        sanitizeExit: false,
      },
    );

    test({
      name: "global test 2",
      fn: testSpys[1],
      ignore: true,
      only: true,
      sanitizeOps: true,
      sanitizeResources: true,
      sanitizeExit: true,
    });
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      {
        name: "global test 2",
        ignore: true,
        only: true,
        sanitizeOps: true,
        sanitizeResources: true,
        sanitizeExit: true,
      },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite tests no options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    const suiteA: TestSuite<void> = new TestSuite({
      name: "top level suite A",
    });

    test(suiteA, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite A test 1" },
    );

    test(suiteA, "test 2", testSpys[1]);
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite A test 2" },
    );

    const suiteB: TestSuite<void> = new TestSuite({
      name: "top level suite B",
    });

    test({
      name: "test 1",
      suite: suiteB,
      fn: testSpys[2],
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "top level suite B test 1" },
    );

    test({
      name: "test 2",
      suite: suiteB,
      fn: testSpys[3],
    });
    assertEquals(registerTestStub.calls.length, 4);
    assertEquals(registerTestStub.calls[3].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[3].args[0]),
      { name: "top level suite B test 2" },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);

    assertEquals(testSpys[2].calls.length, 0);
    await registerTestStub.calls[2].args[0].fn();
    assertEquals(testSpys[2].calls.length, 1);
    assertEquals(testSpys[2].calls[0].args, [{}]);

    assertEquals(testSpys[3].calls.length, 0);
    await registerTestStub.calls[3].args[0].fn();
    assertEquals(testSpys[3].calls.length, 1);
    assertEquals(testSpys[3].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite tests with options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    const suiteA: TestSuite<void> = new TestSuite({
      name: "top level suite A",
    });

    test({
      name: "test 1",
      suite: suiteA,
      fn: testSpys[0],
      ignore: false,
      only: false,
      sanitizeOps: false,
      sanitizeResources: false,
      sanitizeExit: false,
    });
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      {
        name: "top level suite A test 1",
        ignore: false,
        only: false,
        sanitizeOps: false,
        sanitizeResources: false,
        sanitizeExit: false,
      },
    );

    test({
      name: "test 2",
      suite: suiteA,
      fn: testSpys[1],
      ignore: true,
      only: true,
      sanitizeOps: true,
      sanitizeResources: true,
      sanitizeExit: true,
    });
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      {
        name: "top level suite A test 2",
        ignore: true,
        only: true,
        sanitizeOps: true,
        sanitizeResources: true,
        sanitizeExit: true,
      },
    );

    const suiteB: TestSuite<void> = new TestSuite({
      name: "top level suite B",
      ignore: false,
      only: true,
      sanitizeOps: false,
      sanitizeResources: true,
      sanitizeExit: false,
    });

    test({
      name: "test 1",
      suite: suiteB,
      fn: testSpys[2],
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      {
        name: "top level suite B test 1",
        ignore: false,
        only: true,
        sanitizeOps: false,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    test({
      name: "test 2",
      suite: suiteB,
      fn: testSpys[3],
      ignore: true,
      only: false,
    });
    assertEquals(registerTestStub.calls.length, 4);
    assertEquals(registerTestStub.calls[3].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[3].args[0]),
      {
        name: "top level suite B test 2",
        ignore: true,
        only: false,
        sanitizeOps: false,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);

    assertEquals(testSpys[2].calls.length, 0);
    await registerTestStub.calls[2].args[0].fn();
    assertEquals(testSpys[2].calls.length, 1);
    assertEquals(testSpys[2].calls[0].args, [{}]);

    assertEquals(testSpys[3].calls.length, 0);
    await registerTestStub.calls[3].args[0].fn();
    assertEquals(testSpys[3].calls.length, 1);
    assertEquals(testSpys[3].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite test hooks single context empty", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    timer: number;
  }
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
    clearTimeout(context.timer);
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite test hooks single context populated", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    c: number;
    timer: number;
  }
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, { c: 5 });
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3, c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3, c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
    clearTimeout(context.timer);
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      context: { c: 5 },
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite async test hooks single context empty", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    timer: number;
  }
  const beforeAllHook: Spy<void> = spy(async (context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    await delay(1);
    context.a = 3;
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
  });
  const beforeEachHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    await delay(1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
    await delay(1);
  });
  const afterAllHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    await delay(1);
    context.a = 0;
    clearTimeout(context.timer);
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite async test hooks single context populated", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    c: number;
    timer: number;
  }
  const beforeAllHook: Spy<void> = spy(async (context: Context) => {
    assertEquals(context, { c: 5 });
    assertEquals(beforeEachHook.calls.length, 0);
    await delay(1);
    context.a = 3;
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
  });
  const beforeEachHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 3, c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    await delay(1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
    await delay(1);
  });
  const afterAllHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 3, c: 5 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    await delay(1);
    context.a = 0;
    clearTimeout(context.timer);
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example", c: 5 });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      context: { c: 5 },
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level suite beforeAll/afterAll hooks leaking async ops", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    timer: number;
  }
  let timer = -1;
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
    timer = context.timer;
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test suite is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
    if (timer !== -1) clearTimeout(timer);
    // Delay can be removed once following issue is resolved
    // https://github.com/denoland/deno/issues/8954
    await delay(0);
  }
});

Deno.test("top level suite beforeEach/afterEach hooks leaking async ops", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    timer: number;
  }
  let timer = -1;
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
    context.timer = setTimeout(() => {
      throw new Error("Timeout not cleared");
    }, Math.pow(2, 31) - 1);
    timer = context.timer;
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[0].args[0].fn(),
      AssertionError,
      "Test case is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    // Clear previous test's leaking async ops before starting new test
    // Following test will not fail if previous tests timeout isn't cleared first
    // After issue is resolved, clearing all test timeouts can be moved to finally block
    // https://github.com/denoland/deno/issues/8965
    if (timer !== -1) clearTimeout(timer);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test case is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
    // Clear timeout created for test
    if (timer !== -1) clearTimeout(timer);
    // Delay can be removed once following issue is resolved
    // https://github.com/denoland/deno/issues/8954
    await delay(0);
  }
});

Deno.test("top level suite tests leaking async ops", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    timer: number;
  }
  let timer = -1;
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);

      context.timer = setTimeout(() => {
        throw new Error("Timeout not cleared");
      }, Math.pow(2, 31) - 1);
      timer = context.timer;
    }),
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);

      context.timer = setTimeout(() => {
        throw new Error("Timeout not cleared");
      }, Math.pow(2, 31) - 1);
      timer = context.timer;
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 3);
      assertEquals(afterEachHook.calls.length, 2);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);

      context.timer = setTimeout(() => {
        throw new Error("Timeout not cleared");
      }, Math.pow(2, 31) - 1);
      timer = context.timer;
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    test<Context>(suite, "test 3", testSpys[2]);
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "top level suite test 3" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[0].args[0].fn(),
      AssertionError,
      "Test case is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);
    assertEquals(testSpys[2].calls.length, 0);

    // Clear previous test's leaking async ops before starting new test
    // Following test will not fail if previous tests timeout isn't cleared first
    // After issue is resolved, clearing all test timeouts can be moved to finally block
    // https://github.com/denoland/deno/issues/8965
    if (timer !== -1) clearTimeout(timer);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test case is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[2].calls.length, 0);

    // Clear previous test's leaking async ops before starting new test
    // Following test will not fail if previous tests timeout isn't cleared first
    // After issue is resolved, clearing all test timeouts can be moved to finally block
    // https://github.com/denoland/deno/issues/8965
    if (timer !== -1) clearTimeout(timer);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[2].args[0].fn(),
      AssertionError,
      "Test case is leaking async ops.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 3);
    assertEquals(afterEachHook.calls.length, 3);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[2].calls.length, 1);
  } finally {
    registerTestStub.restore();
    // Clear timeout created for test
    if (timer !== -1) clearTimeout(timer);
    // Delay can be removed once following issue is resolved
    // https://github.com/denoland/deno/issues/8954
    await delay(0);
  }
});

Deno.test("top level suite beforeAll/afterAll hooks leaking resources", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    file: Deno.File;
  }
  let file: Deno.File | null = null;
  const beforeAllHook: Spy<void> = spy(async (context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
    context.file = await Deno.open("./mod.ts");
    file = context.file;
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test suite is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
    if (file) Deno.close((file as Deno.File).rid);
  }
});

Deno.test("top level suite beforeEach/afterEach hooks leaking resources", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    file: Deno.File;
  }
  const files: Deno.File[] = [];
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
  });
  const beforeEachHook: Spy<void> = spy(async (context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
    context.file = await Deno.open("./mod.ts");
    files.push(context.file);
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy((context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      await delay(1);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[0].args[0].fn(),
      AssertionError,
      "Test case is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test case is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
    files.forEach((file: Deno.File) => {
      Deno.close(file.rid);
    });
  }
});

Deno.test("top level suite tests leaking resources", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  interface Context {
    a: number;
    b: string;
    file: Deno.File;
  }
  const files: Deno.File[] = [];
  const beforeAllHook: Spy<void> = spy((context: Context) => {
    assertEquals(context, {});
    assertEquals(beforeEachHook.calls.length, 0);
    context.a = 3;
  });
  const beforeEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    context.a *= 4;
    context.b = "example";
  });
  let expectedBeforeEachCalls = 1;
  const afterEachHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 12, b: "example" });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, expectedBeforeEachCalls++);
    assertEquals(afterAllHook.calls.length, 0);
  });
  const afterAllHook: Spy<void> = spy((context: Context) => {
    assertObjectMatch({ ...context }, { a: 3 });
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    context.a = 0;
  });
  const testSpys: Spy<void>[] = [
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 1);
      assertEquals(afterEachHook.calls.length, 0);
      assertEquals(afterAllHook.calls.length, 0);
      context.file = await Deno.open("./mod.ts");
      files.push(context.file);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 2);
      assertEquals(afterEachHook.calls.length, 1);
      assertEquals(afterAllHook.calls.length, 0);
      context.file = await Deno.open("./mod.ts");
      files.push(context.file);
    }),
    spy(async (context: Context) => {
      assertObjectMatch({ ...context }, { a: 12, b: "example" });
      assertEquals(beforeAllHook.calls.length, 1);
      assertEquals(beforeEachHook.calls.length, 3);
      assertEquals(afterEachHook.calls.length, 2);
      assertEquals(afterAllHook.calls.length, 0);
      context.file = await Deno.open("./mod.ts");
      files.push(context.file);
    }),
  ];

  try {
    TestSuite.reset();

    const suite: TestSuite<Context> = new TestSuite({
      name: "top level suite",
      beforeAll: beforeAllHook,
      beforeEach: beforeEachHook,
      afterEach: afterEachHook,
      afterAll: afterAllHook,
    });

    test<Context>(suite, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite test 1" },
    );

    test(
      suite,
      "test 2",
      testSpys[1] as unknown as ((context: Context) => void),
    );
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite test 2" },
    );

    test<Context>(suite, "test 3", testSpys[2]);
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "top level suite test 3" },
    );

    assertEquals(beforeAllHook.calls.length, 0);
    assertEquals(beforeEachHook.calls.length, 0);
    assertEquals(afterEachHook.calls.length, 0);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[0].args[0].fn(),
      AssertionError,
      "Test case is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 1);
    assertEquals(afterEachHook.calls.length, 1);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);
    assertEquals(testSpys[2].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[1].args[0].fn(),
      AssertionError,
      "Test case is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 2);
    assertEquals(afterEachHook.calls.length, 2);
    assertEquals(afterAllHook.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[2].calls.length, 0);

    await assertThrowsAsync(
      async () => await registerTestStub.calls[2].args[0].fn(),
      AssertionError,
      "Test case is leaking resources.",
    );
    assertEquals(beforeAllHook.calls.length, 1);
    assertEquals(beforeEachHook.calls.length, 3);
    assertEquals(afterEachHook.calls.length, 3);
    assertEquals(afterAllHook.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[2].calls.length, 1);
  } finally {
    registerTestStub.restore();
    files.forEach((file: Deno.File) => {
      Deno.close(file.rid);
    });
  }
});

Deno.test("multi level suite tests no options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    const suiteA: TestSuite<void> = new TestSuite({
      name: "top level suite A",
    });

    test(suiteA, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "top level suite A test 1" },
    );

    const suiteB: TestSuite<void> = new TestSuite({
      name: "sub-suite B",
      suite: suiteA,
    });

    test({
      name: "test 1",
      suite: suiteB,
      fn: testSpys[1],
    });
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "top level suite A sub-suite B test 1" },
    );

    test({
      name: "test 2",
      suite: suiteB,
      fn: testSpys[2],
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "top level suite A sub-suite B test 2" },
    );

    test(suiteA, "test 2", testSpys[3]);
    assertEquals(registerTestStub.calls.length, 4);
    assertEquals(registerTestStub.calls[3].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[3].args[0]),
      { name: "top level suite A test 2" },
    );

    const suiteC: TestSuite<void> = new TestSuite({
      name: "sub-suite C",
      suite: suiteA,
    });

    test(suiteC, "test 1", testSpys[4]);
    assertEquals(registerTestStub.calls.length, 5);
    assertEquals(registerTestStub.calls[4].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[4].args[0]),
      { name: "top level suite A sub-suite C test 1" },
    );

    test(suiteC, "test 2", testSpys[5]);
    assertEquals(registerTestStub.calls.length, 6);
    assertEquals(registerTestStub.calls[5].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[5].args[0]),
      { name: "top level suite A sub-suite C test 2" },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);

    assertEquals(testSpys[2].calls.length, 0);
    await registerTestStub.calls[2].args[0].fn();
    assertEquals(testSpys[2].calls.length, 1);
    assertEquals(testSpys[2].calls[0].args, [{}]);

    assertEquals(testSpys[3].calls.length, 0);
    await registerTestStub.calls[3].args[0].fn();
    assertEquals(testSpys[3].calls.length, 1);
    assertEquals(testSpys[3].calls[0].args, [{}]);

    assertEquals(testSpys[4].calls.length, 0);
    await registerTestStub.calls[4].args[0].fn();
    assertEquals(testSpys[4].calls.length, 1);
    assertEquals(testSpys[4].calls[0].args, [{}]);

    assertEquals(testSpys[5].calls.length, 0);
    await registerTestStub.calls[5].args[0].fn();
    assertEquals(testSpys[5].calls.length, 1);
    assertEquals(testSpys[5].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("multi level suite tests with options", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
    spy(),
    spy(async () => await delay(1)),
  ];

  try {
    TestSuite.reset();

    const suiteA: TestSuite<void> = new TestSuite({
      name: "top level suite A",
      ignore: false,
      only: true,
      sanitizeOps: false,
      sanitizeResources: true,
      sanitizeExit: false,
    });

    test(suiteA, "test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      {
        name: "top level suite A test 1",
        ignore: false,
        only: true,
        sanitizeOps: false,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    const suiteB: TestSuite<void> = new TestSuite({
      name: "sub-suite B",
      suite: suiteA,
      only: false,
      sanitizeOps: true,
    });

    test({
      name: "test 1",
      suite: suiteB,
      fn: testSpys[1],
    });
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      {
        name: "top level suite A sub-suite B test 1",
        ignore: false,
        only: false,
        sanitizeOps: true,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    test({
      name: "test 2",
      suite: suiteB,
      fn: testSpys[2],
      ignore: true,
      sanitizeResources: false,
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      {
        name: "top level suite A sub-suite B test 2",
        ignore: true,
        only: false,
        sanitizeOps: true,
        sanitizeResources: false,
        sanitizeExit: false,
      },
    );

    test(suiteA, "test 2", testSpys[3]);
    assertEquals(registerTestStub.calls.length, 4);
    assertEquals(registerTestStub.calls[3].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[3].args[0]),
      {
        name: "top level suite A test 2",
        ignore: false,
        only: true,
        sanitizeOps: false,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    const suiteC: TestSuite<void> = new TestSuite({
      name: "sub-suite C",
      suite: suiteA,
      only: false,
      sanitizeOps: true,
    });

    test(suiteC, "test 1", testSpys[4]);
    assertEquals(registerTestStub.calls.length, 5);
    assertEquals(registerTestStub.calls[4].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[4].args[0]),
      {
        name: "top level suite A sub-suite C test 1",
        ignore: false,
        only: false,
        sanitizeOps: true,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    test(suiteC, "test 2", testSpys[5]);
    assertEquals(registerTestStub.calls.length, 6);
    assertEquals(registerTestStub.calls[5].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[5].args[0]),
      {
        name: "top level suite A sub-suite C test 2",
        ignore: false,
        only: false,
        sanitizeOps: true,
        sanitizeResources: true,
        sanitizeExit: false,
      },
    );

    assertEquals(testSpys[0].calls.length, 0);
    await registerTestStub.calls[0].args[0].fn();
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[0].calls[0].args, [{}]);

    assertEquals(testSpys[1].calls.length, 0);
    await registerTestStub.calls[1].args[0].fn();
    assertEquals(testSpys[1].calls.length, 1);
    assertEquals(testSpys[1].calls[0].args, [{}]);

    assertEquals(testSpys[2].calls.length, 0);
    await registerTestStub.calls[2].args[0].fn();
    assertEquals(testSpys[2].calls.length, 1);
    assertEquals(testSpys[2].calls[0].args, [{}]);

    assertEquals(testSpys[3].calls.length, 0);
    await registerTestStub.calls[3].args[0].fn();
    assertEquals(testSpys[3].calls.length, 1);
    assertEquals(testSpys[3].calls[0].args, [{}]);

    assertEquals(testSpys[4].calls.length, 0);
    await registerTestStub.calls[4].args[0].fn();
    assertEquals(testSpys[4].calls.length, 1);
    assertEquals(testSpys[4].calls[0].args, [{}]);

    assertEquals(testSpys[5].calls.length, 0);
    await registerTestStub.calls[5].args[0].fn();
    assertEquals(testSpys[5].calls.length, 1);
    assertEquals(testSpys[5].calls[0].args, [{}]);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("tests require valid name", () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );

  try {
    TestSuite.reset();
    assertThrows(
      () => test(5 as unknown as string, () => {}),
      TypeError,
      "name must be a string",
    );
    assertThrows(() => test("", () => {}), TypeError, "name cannot be empty");
    assertThrows(
      () => test(" example", () => {}),
      TypeError,
      "name cannot start or end with a space",
    );
    assertThrows(
      () => test("example ", () => {}),
      TypeError,
      "name cannot start or end with a space",
    );
    test("example", () => {});
    assertThrows(
      () => test("example", () => {}),
      Error,
      "test name already used",
    );
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("tests require function", () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );

  try {
    TestSuite.reset();
    assertThrows(
      () => test("no fn argument", null as unknown as (() => void)),
      TypeError,
      "fn argument or option missing",
    );
    assertThrows(
      () => test({ name: "no fn option" } as unknown as TestDefinition<void>),
      Error,
      "fn argument or option missing",
    );
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("test suites require valid name", () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );

  try {
    TestSuite.reset();
    assertThrows(
      () => new TestSuite({ name: 5 as unknown as string }),
      TypeError,
      "name must be a string",
    );
    assertThrows(
      () => new TestSuite({ name: "" }),
      TypeError,
      "name cannot be empty",
    );
    assertThrows(
      () => new TestSuite({ name: " example" }),
      TypeError,
      "name cannot start or end with a space",
    );
    assertThrows(
      () => new TestSuite({ name: "example " }),
      TypeError,
      "name cannot start or end with a space",
    );
    new TestSuite({ name: "example" });
    assertThrows(
      () => new TestSuite({ name: "example" }),
      Error,
      "suite name already used",
    );
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("test suites cannot be modified after another test suite starts", () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );

  try {
    TestSuite.reset();
    const exampleTests = new TestSuite({ name: "example1" });
    new TestSuite({ name: "child1" });
    new TestSuite({ name: "example2" });
    assertThrows(
      () => test({ name: "test", suite: exampleTests, fn() {} }),
      Error,
      "cannot add test after starting another test suite",
    );
    assertThrows(
      () => new TestSuite({ name: "child2", suite: exampleTests }),
      Error,
      "cannot add child test suite after starting another test suite",
    );
  } finally {
    registerTestStub.restore();
  }
});
