import { assert, assertEquals, delay } from "./deps.ts";
import { Spy, spy, Stub, stub } from "./test_deps.ts";
import { TestSuite } from "./test_suite.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "./describe.ts";

function testDefinition(
  options: Deno.TestDefinition,
): Partial<Deno.TestDefinition> {
  const rslt: Partial<Deno.TestDefinition> = { ...options };
  delete rslt.fn;
  return rslt;
}

Deno.test("global it no options", async () => {
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

    it("global test 1", testSpys[0]);
    assertEquals(registerTestStub.calls.length, 1);
    assertEquals(registerTestStub.calls[0].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[0].args[0]),
      { name: "global test 1" },
    );

    it("global test 2", testSpys[1]);
    assertEquals(registerTestStub.calls.length, 2);
    assertEquals(registerTestStub.calls[1].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[1].args[0]),
      { name: "global test 2" },
    );

    it({
      name: "global test 3",
      fn: testSpys[2],
    });
    assertEquals(registerTestStub.calls.length, 3);
    assertEquals(registerTestStub.calls[2].args.length, 1);
    assertEquals(
      testDefinition(registerTestStub.calls[2].args[0]),
      { name: "global test 3" },
    );

    it({
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

Deno.test("global it with options", async () => {
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

    it({
      name: "global test 1",
      fn: testSpys[0],
      ignore: false,
      only: false,
      sanitizeOps: false,
      sanitizeResources: false,
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
      },
    );

    it({
      name: "global test 2",
      fn: testSpys[1],
      ignore: true,
      only: true,
      sanitizeOps: true,
      sanitizeResources: true,
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

Deno.test("top level describe it no options", async () => {
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

    describe("top level suite A", () => {
      it("test 1", testSpys[0]);
      assertEquals(registerTestStub.calls.length, 1);
      assertEquals(registerTestStub.calls[0].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[0].args[0]),
        { name: "top level suite A test 1" },
      );

      it("test 2", testSpys[1]);
      assertEquals(registerTestStub.calls.length, 2);
      assertEquals(registerTestStub.calls[1].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[1].args[0]),
        { name: "top level suite A test 2" },
      );
    });

    describe("top level suite B", () => {
      it({
        name: "test 1",
        fn: testSpys[2],
      });
      assertEquals(registerTestStub.calls.length, 3);
      assertEquals(registerTestStub.calls[2].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[2].args[0]),
        { name: "top level suite B test 1" },
      );

      it({
        name: "test 2",
        fn: testSpys[3],
      });
      assertEquals(registerTestStub.calls.length, 4);
      assertEquals(registerTestStub.calls[3].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[3].args[0]),
        { name: "top level suite B test 2" },
      );
    });

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

Deno.test("top level describe it with options", async () => {
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

    describe("top level suite A", () => {
      it({
        name: "test 1",
        fn: testSpys[0],
        ignore: false,
        only: false,
        sanitizeOps: false,
        sanitizeResources: false,
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
        },
      );

      it({
        name: "test 2",
        fn: testSpys[1],
        ignore: true,
        only: true,
        sanitizeOps: true,
        sanitizeResources: true,
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
        },
      );
    });

    describe({
      name: "top level suite B",
      ignore: false,
      only: true,
      sanitizeOps: false,
      sanitizeResources: true,
      fn() {
        it({
          name: "test 1",
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
          },
        );

        it({
          name: "test 2",
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
          },
        );
      },
    });

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

Deno.test("top level describe it hooks", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [];

  try {
    TestSuite.reset();

    let beforeAllHook: Spy<void> | null = null;
    let beforeEachHook: Spy<void> | null = null;
    let afterEachHook: Spy<void> | null = null;
    let afterAllHook: Spy<void> | null = null;
    describe("top level suite", () => {
      let a: number;
      let b: string;
      let timer: number;

      beforeAllHook = spy(() => {
        assertEquals(beforeEachHook?.calls.length, 0);
        a = 3;
        b = "";
        timer = setTimeout(() => {
          throw new Error("Timeout not cleared");
        }, Math.pow(2, 31) - 1);
      });
      beforeEachHook = spy(() => {
        assertEquals({ a, b }, { a: 3, b: "" });
        assertEquals(beforeAllHook?.calls.length, 1);
        a *= 4;
        b = "example";
      });
      let expectedBeforeEachCalls = 1;
      afterEachHook = spy(() => {
        assertEquals({ a, b }, { a: 12, b: "example" });
        a /= 4;
        b = "";
        assertEquals(beforeAllHook?.calls.length, 1);
        assertEquals(beforeEachHook?.calls.length, expectedBeforeEachCalls++);
        assertEquals(afterAllHook?.calls.length, 0);
      });
      afterAllHook = spy(() => {
        assertEquals({ a, b }, { a: 3, b: "" });
        assertEquals(beforeAllHook?.calls.length, 1);
        assertEquals(beforeEachHook?.calls.length, 2);
        assertEquals(afterEachHook?.calls.length, 2);
        clearTimeout(timer);
      });
      beforeAll(beforeAllHook);
      beforeEach(beforeEachHook);
      afterEach(afterEachHook);
      afterAll(afterAllHook);

      testSpys.push(
        spy(() => {
          assertEquals({ a, b }, { a: 12, b: "example" });
          assertEquals(beforeAllHook?.calls.length, 1);
          assertEquals(beforeEachHook?.calls.length, 1);
          assertEquals(afterEachHook?.calls.length, 0);
          assertEquals(afterAllHook?.calls.length, 0);
        }),
        spy(async () => {
          assertEquals({ a, b }, { a: 12, b: "example" });
          assertEquals(beforeAllHook?.calls.length, 1);
          assertEquals(beforeEachHook?.calls.length, 2);
          assertEquals(afterEachHook?.calls.length, 1);
          assertEquals(afterAllHook?.calls.length, 0);
          await delay(1);
        }),
      );

      it("test 1", testSpys[0]);
      assertEquals(registerTestStub.calls.length, 1);
      assertEquals(registerTestStub.calls[0].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[0].args[0]),
        { name: "top level suite test 1" },
      );

      it("test 2", testSpys[1]);
      assertEquals(registerTestStub.calls.length, 2);
      assertEquals(registerTestStub.calls[1].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[1].args[0]),
        { name: "top level suite test 2" },
      );
    });

    assert(beforeAllHook !== null);
    assert(beforeEachHook !== null);
    assert(afterEachHook !== null);
    assert(afterAllHook !== null);
    beforeAllHook = beforeAllHook as Spy<void>;
    beforeEachHook = beforeEachHook as Spy<void>;
    afterEachHook = afterEachHook as Spy<void>;
    afterAllHook = afterAllHook as Spy<void>;

    assertEquals(beforeAllHook!.calls.length, 0);
    assertEquals(beforeEachHook!.calls.length, 0);
    assertEquals(afterEachHook!.calls.length, 0);
    assertEquals(afterAllHook!.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook!.calls.length, 1);
    assertEquals(beforeEachHook!.calls.length, 1);
    assertEquals(afterEachHook!.calls.length, 1);
    assertEquals(afterAllHook!.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook!.calls.length, 1);
    assertEquals(beforeEachHook!.calls.length, 2);
    assertEquals(afterEachHook!.calls.length, 2);
    assertEquals(afterAllHook!.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("top level describe it async hooks", async () => {
  const registerTestStub: Stub<typeof TestSuite> = stub(
    TestSuite,
    "registerTest",
  );
  const testSpys: Spy<void>[] = [];

  try {
    TestSuite.reset();

    let beforeAllHook: Spy<void> | null = null;
    let beforeEachHook: Spy<void> | null = null;
    let afterEachHook: Spy<void> | null = null;
    let afterAllHook: Spy<void> | null = null;
    describe("top level suite", () => {
      let a: number;
      let b: string;
      let timer: number;

      beforeAllHook = spy(async () => {
        assertEquals(beforeEachHook?.calls.length, 0);
        await delay(1);
        a = 3;
        b = "";
        timer = setTimeout(() => {
          throw new Error("Timeout not cleared");
        }, Math.pow(2, 31) - 1);
      });
      beforeEachHook = spy(async () => {
        assertEquals({ a, b }, { a: 3, b: "" });
        assertEquals(beforeAllHook?.calls.length, 1);
        await delay(1);
        a *= 4;
        b = "example";
      });
      let expectedBeforeEachCalls = 1;
      afterEachHook = spy(async () => {
        assertEquals({ a, b }, { a: 12, b: "example" });
        a /= 4;
        b = "";
        assertEquals(beforeAllHook?.calls.length, 1);
        assertEquals(beforeEachHook?.calls.length, expectedBeforeEachCalls++);
        assertEquals(afterAllHook?.calls.length, 0);
        await delay(1);
      });
      afterAllHook = spy(async () => {
        assertEquals({ a, b }, { a: 3, b: "" });
        assertEquals(beforeAllHook?.calls.length, 1);
        assertEquals(beforeEachHook?.calls.length, 2);
        assertEquals(afterEachHook?.calls.length, 2);
        await delay(1);
        clearTimeout(timer);
      });

      beforeAll(beforeAllHook);
      beforeEach(beforeEachHook);
      afterEach(afterEachHook);
      afterAll(afterAllHook);

      testSpys.push(
        spy(() => {
          assertEquals({ a, b }, { a: 12, b: "example" });
          assertEquals(beforeAllHook?.calls.length, 1);
          assertEquals(beforeEachHook?.calls.length, 1);
          assertEquals(afterEachHook?.calls.length, 0);
          assertEquals(afterAllHook?.calls.length, 0);
        }),
        spy(async () => {
          assertEquals({ a, b }, { a: 12, b: "example" });
          assertEquals(beforeAllHook?.calls.length, 1);
          assertEquals(beforeEachHook?.calls.length, 2);
          assertEquals(afterEachHook?.calls.length, 1);
          assertEquals(afterAllHook?.calls.length, 0);
          await delay(1);
        }),
      );

      it("test 1", testSpys[0]);
      assertEquals(registerTestStub.calls.length, 1);
      assertEquals(registerTestStub.calls[0].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[0].args[0]),
        { name: "top level suite test 1" },
      );

      it("test 2", testSpys[1]);
      assertEquals(registerTestStub.calls.length, 2);
      assertEquals(registerTestStub.calls[1].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[1].args[0]),
        { name: "top level suite test 2" },
      );
    });

    assert(beforeAllHook !== null);
    assert(beforeEachHook !== null);
    assert(afterEachHook !== null);
    assert(afterAllHook !== null);
    beforeAllHook = beforeAllHook as Spy<void>;
    beforeEachHook = beforeEachHook as Spy<void>;
    afterEachHook = afterEachHook as Spy<void>;
    afterAllHook = afterAllHook as Spy<void>;

    assertEquals(beforeAllHook!.calls.length, 0);
    assertEquals(beforeEachHook!.calls.length, 0);
    assertEquals(afterEachHook!.calls.length, 0);
    assertEquals(afterAllHook!.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 0);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[0].args[0].fn();
    assertEquals(beforeAllHook!.calls.length, 1);
    assertEquals(beforeEachHook!.calls.length, 1);
    assertEquals(afterEachHook!.calls.length, 1);
    assertEquals(afterAllHook!.calls.length, 0);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 0);

    await registerTestStub.calls[1].args[0].fn();
    assertEquals(beforeAllHook!.calls.length, 1);
    assertEquals(beforeEachHook!.calls.length, 2);
    assertEquals(afterEachHook!.calls.length, 2);
    assertEquals(afterAllHook!.calls.length, 1);
    assertEquals(testSpys[0].calls.length, 1);
    assertEquals(testSpys[1].calls.length, 1);
  } finally {
    registerTestStub.restore();
  }
});

Deno.test("multi level describe it no options", async () => {
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

    describe("top level suite A", () => {
      it("test 1", testSpys[0]);
      assertEquals(registerTestStub.calls.length, 1);
      assertEquals(registerTestStub.calls[0].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[0].args[0]),
        { name: "top level suite A test 1" },
      );

      describe("sub-suite B", () => {
        it({
          name: "test 1",
          fn: testSpys[1],
        });
        assertEquals(registerTestStub.calls.length, 2);
        assertEquals(registerTestStub.calls[1].args.length, 1);
        assertEquals(
          testDefinition(registerTestStub.calls[1].args[0]),
          { name: "top level suite A sub-suite B test 1" },
        );

        it({
          name: "test 2",
          fn: testSpys[2],
        });
        assertEquals(registerTestStub.calls.length, 3);
        assertEquals(registerTestStub.calls[2].args.length, 1);
        assertEquals(
          testDefinition(registerTestStub.calls[2].args[0]),
          { name: "top level suite A sub-suite B test 2" },
        );
      });

      it("test 2", testSpys[3]);
      assertEquals(registerTestStub.calls.length, 4);
      assertEquals(registerTestStub.calls[3].args.length, 1);
      assertEquals(
        testDefinition(registerTestStub.calls[3].args[0]),
        { name: "top level suite A test 2" },
      );

      describe("sub-suite C", () => {
        it("test 1", testSpys[4]);
        assertEquals(registerTestStub.calls.length, 5);
        assertEquals(registerTestStub.calls[4].args.length, 1);
        assertEquals(
          testDefinition(registerTestStub.calls[4].args[0]),
          { name: "top level suite A sub-suite C test 1" },
        );

        it("test 2", testSpys[5]);
        assertEquals(registerTestStub.calls.length, 6);
        assertEquals(registerTestStub.calls[5].args.length, 1);
        assertEquals(
          testDefinition(registerTestStub.calls[5].args[0]),
          { name: "top level suite A sub-suite C test 2" },
        );
      });
    });

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

    describe({
      name: "top level suite A",
      ignore: false,
      only: true,
      sanitizeOps: false,
      sanitizeResources: true,
      fn() {
        it("test 1", testSpys[0]);
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
          },
        );

        describe({
          name: "sub-suite B",
          only: false,
          sanitizeOps: true,
          fn() {
            it({
              name: "test 1",
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
              },
            );

            it({
              name: "test 2",
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
              },
            );
          },
        });

        it("test 2", testSpys[3]);
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
          },
        );

        describe({
          name: "sub-suite C",
          only: false,
          sanitizeOps: true,
          fn() {
            it("test 1", testSpys[4]);
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
              },
            );

            it("test 2", testSpys[5]);
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
              },
            );
          },
        });
      },
    });

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
