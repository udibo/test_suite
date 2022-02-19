import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertStrictEquals,
} from "./deps.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  TestSuite,
} from "./describe.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  FakeTime,
  Spy,
  spy,
  stub,
} from "./test_deps.ts";

class TestContext implements Deno.TestContext {
  steps: TestContext[];
  spies: {
    step: Spy<void>;
  };

  constructor() {
    this.spies = {
      step: spy(this, "step"),
    };
    this.steps = [];
  }

  async step(t: Deno.TestStepDefinition): Promise<boolean>;
  async step(
    name: string,
    fn: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  async step(
    tOrName: Deno.TestStepDefinition | string,
    fn?: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean> {
    let ignore = false;
    if (typeof tOrName === "object") {
      ignore = tOrName.ignore ?? false;
      fn = tOrName.fn;
    }

    const context = new TestContext();
    this.steps.push(context);
    if (!ignore) {
      await fn!(context);
    }
    return !ignore;
  }
}

const baseStepOptions: Omit<Deno.TestStepDefinition, "name" | "fn"> = {
  ignore: false,
  sanitizeExit: true,
  sanitizeOps: true,
  sanitizeResources: true,
};

const baseOptions: Omit<Deno.TestDefinition, "name" | "fn"> = {
  ...baseStepOptions,
  only: false,
  permissions: "inherit",
};

Deno.test("global", async (t) => {
  await t.step("it", async (t) => {
    async function assertOptionsFn(
      options: Deno.TestDefinition,
      fn: Spy<void>,
    ): Promise<void> {
      const context = new TestContext();
      const result = options.fn(context);
      assertStrictEquals(Promise.resolve(result), result);
      assertEquals(await result, undefined);
      assertSpyCalls(context.spies.step, 0);
      assertSpyCall(fn, 0, {
        self: undefined,
        args: [{}],
        returned: undefined,
      });
    }

    async function assertOptions<T>(
      expectedOptions: Omit<Deno.TestDefinition, "name" | "fn">,
      cb: (fn: Spy<void>) => void,
    ): Promise<void> {
      const test = stub(Deno, "test");
      const fn = spy();
      try {
        cb(fn);
      } finally {
        test.restore();
      }
      assertSpyCalls(fn, 0);
      const call = assertSpyCall(test, 0);
      const options = call.args[0] as Deno.TestDefinition;
      assertEquals(
        Object.keys(options).sort(),
        ["name", "fn", ...Object.keys(expectedOptions)].sort(),
      );
      assertObjectMatch(options, {
        name: "example",
        ...expectedOptions,
      });
      await assertOptionsFn(options, fn);
    }

    async function assertMinimumOptions(
      cb: (fn: Spy<void>) => void,
    ): Promise<void> {
      await assertOptions({}, cb);
    }

    async function assertAllOptions(
      cb: (fn: Spy<void>) => void,
    ): Promise<void> {
      await assertOptions(baseOptions, cb);
    }

    await t.step("signature 1", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it({ name: "example", fn }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fn) => {
          assertEquals(
            it({
              name: "example",
              fn,
              ...baseOptions,
            }),
            undefined,
          );
        }));
    });

    await t.step("signature 2", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it("example", { fn }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fn) => {
          assertEquals(
            it("example", {
              fn,
              ...baseOptions,
            }),
            undefined,
          );
        }));
    });

    await t.step("signature 3", async () =>
      await assertMinimumOptions((fn) => {
        assertEquals(it("example", fn), undefined);
      }));

    await t.step("signature 4", async () =>
      await assertMinimumOptions((fn) => {
        assertEquals(
          it(function example() {
            fn.apply(undefined, Array.from(arguments));
          }),
          undefined,
        );
      }));

    await t.step("signature 5", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it("example", {}, fn), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fn) => {
          assertEquals(
            it("example", {
              ...baseOptions,
            }, fn),
            undefined,
          );
        }));
    });

    await t.step("signature 6", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it({ name: "example" }, fn), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fn) => {
          assertEquals(
            it({
              name: "example",
              ...baseOptions,
            }, fn),
            undefined,
          );
        }));
    });

    await t.step("signature 7", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(
              it({}, function example() {
                fn.apply(undefined, Array.from(arguments));
              }),
              undefined,
            );
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fn) => {
          assertEquals(
            it({
              ...baseOptions,
            }, function example() {
              fn.apply(undefined, Array.from(arguments));
            }),
            undefined,
          );
        }));
    });

    await t.step("only", async (t) => {
      async function assertMinimumOptions(
        cb: (fn: Spy<void>) => void,
      ): Promise<void> {
        await assertOptions({ only: true }, cb);
      }

      async function assertAllOptions(
        cb: (fn: Spy<void>) => void,
      ): Promise<void> {
        await assertOptions({ ...baseOptions, only: true }, cb);
      }

      await t.step("signature 1", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.only({ name: "example", fn }), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.only({
                name: "example",
                fn,
                ...baseOptions,
              }),
              undefined,
            );
          }));
      });

      await t.step("signature 2", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.only("example", { fn }), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.only("example", {
                fn,
                ...baseOptions,
              }),
              undefined,
            );
          }));
      });

      await t.step(
        "signature 3",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it.only("example", fn), undefined);
          }),
      );

      await t.step(
        "signature 4",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(
              it.only(function example() {
                fn.apply(undefined, Array.from(arguments));
              }),
              undefined,
            );
          }),
      );

      await t.step("signature 5", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.only("example", {}, fn), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.only("example", {
                ...baseOptions,
              }, fn),
              undefined,
            );
          }));
      });

      await t.step("signature 6", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.only({ name: "example" }, fn), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.only({
                name: "example",
                ...baseOptions,
              }, fn),
              undefined,
            );
          }));
      });

      await t.step("signature 7", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(
                it.only({}, function example() {
                  fn.apply(undefined, Array.from(arguments));
                }),
                undefined,
              );
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.only({
                ...baseOptions,
              }, function example() {
                fn.apply(undefined, Array.from(arguments));
              }),
              undefined,
            );
          }));
      });
    });

    await t.step("ignore", async (t) => {
      async function assertMinimumOptions(
        cb: (fn: Spy<void>) => void,
      ): Promise<void> {
        await assertOptions({ ignore: true }, cb);
      }

      async function assertAllOptions(
        cb: (fn: Spy<void>) => void,
      ): Promise<void> {
        await assertOptions({ ...baseOptions, ignore: true }, cb);
      }

      await t.step("signature 1", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.ignore({ name: "example", fn }), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.ignore({
                name: "example",
                fn,
                ...baseOptions,
              }),
              undefined,
            );
          }));
      });

      await t.step("signature 2", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.ignore("example", { fn }), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.ignore("example", {
                fn,
                ...baseOptions,
              }),
              undefined,
            );
          }));
      });

      await t.step(
        "signature 3",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(it.ignore("example", fn), undefined);
          }),
      );

      await t.step(
        "signature 4",
        async () =>
          await assertMinimumOptions((fn) => {
            assertEquals(
              it.ignore(function example() {
                fn.apply(undefined, Array.from(arguments));
              }),
              undefined,
            );
          }),
      );

      await t.step("signature 5", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.ignore("example", {}, fn), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.ignore("example", {
                ...baseOptions,
              }, fn),
              undefined,
            );
          }));
      });

      await t.step("signature 6", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(it.ignore({ name: "example" }, fn), undefined);
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.ignore({
                name: "example",
                ...baseOptions,
              }, fn),
              undefined,
            );
          }));
      });

      await t.step("signature 7", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fn) => {
              assertEquals(
                it.ignore({}, function example() {
                  fn.apply(undefined, Array.from(arguments));
                }),
                undefined,
              );
            }),
        );

        await t.step("all options", async () =>
          await assertAllOptions((fn) => {
            assertEquals(
              it.ignore({
                ...baseOptions,
              }, function example() {
                fn.apply(undefined, Array.from(arguments));
              }),
              undefined,
            );
          }));
      });
    });
  });

  await t.step("describe", async (t) => {
    async function assertOptionsFn(
      options: Deno.TestDefinition,
      fns: Spy<void>[],
    ): Promise<void> {
      assertSpyCalls(fns[0], 0);
      assertSpyCalls(fns[1], 0);

      const context = new TestContext();
      const result = options.fn(context);
      assertStrictEquals(Promise.resolve(result), result);
      assertEquals(await result, undefined);
      assertSpyCalls(context.spies.step, 2);

      let fn = fns[0];
      assertSpyCall(fn, 0, {
        self: undefined,
        args: [{}],
        returned: undefined,
      });

      fn = fns[1];
      assertSpyCall(fn, 0, {
        self: undefined,
        args: [{}],
        returned: undefined,
      });
      assertSpyCalls(fn, 1);
    }

    async function assertOptions(
      expectedOptions: Omit<Deno.TestDefinition, "name" | "fn">,
      cb: (fns: Spy<void>[]) => void,
    ): Promise<void> {
      const test = stub(Deno, "test");
      const fns = [spy(), spy()];
      try {
        cb(fns);
      } finally {
        test.restore();
      }

      const call = assertSpyCall(test, 0);
      const options = call.args[0] as Deno.TestDefinition;
      assertEquals(
        Object.keys(options).sort(),
        ["name", "fn", ...Object.keys(expectedOptions)].sort(),
      );
      assertObjectMatch(options, {
        name: "example",
        ...expectedOptions,
      });
      await assertOptionsFn(options, fns);
    }

    async function assertMinimumOptions(
      cb: (fns: Spy<void>[]) => void,
    ): Promise<void> {
      await assertOptions({}, cb);
    }

    async function assertAllOptions(
      cb: (fns: Spy<void>[]) => void,
    ): Promise<void> {
      await assertOptions({ ...baseOptions }, cb);
    }

    await t.step("signature 1", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe({ name: "example" });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fns) => {
          const suite = describe({
            name: "example",
            fn: () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            },
            ...baseOptions,
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }));
    });

    await t.step(
      "signature 2",
      async () =>
        await assertMinimumOptions((fns) => {
          const suite = describe("example");
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }),
    );

    await t.step("signature 3", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe("example", {});
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fns) => {
          const suite = describe("example", {
            fn: () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            },
            ...baseOptions,
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }));
    });

    await t.step(
      "signature 4",
      async () =>
        await assertMinimumOptions((fns) => {
          const suite = describe("example", () => {
            assertEquals(it({ name: "a", fn: fns[0] }), undefined);
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }),
    );

    await t.step(
      "signature 5",
      async () =>
        await assertMinimumOptions((fns) => {
          const suite = describe(function example() {
            assertEquals(it({ name: "a", fn: fns[0] }), undefined);
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }),
    );

    await t.step("signature 6", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe("example", {}, () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fns) => {
          const suite = describe("example", {
            ...baseOptions,
          }, () => {
            assertEquals(it({ name: "a", fn: fns[0] }), undefined);
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }));
    });

    await t.step("signature 7", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe({ name: "example" }, () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fns) => {
          const suite = describe({
            name: "example",
            ...baseOptions,
          }, () => {
            assertEquals(it({ name: "a", fn: fns[0] }), undefined);
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }));
    });

    await t.step("signature 8", async (t) => {
      await t.step(
        "minimum options",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe({}, function example() {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("all options", async () =>
        await assertAllOptions((fns) => {
          const suite = describe({
            ...baseOptions,
          }, function example() {
            assertEquals(it({ name: "a", fn: fns[0] }), undefined);
          });
          assert(suite instanceof TestSuite);
          assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
        }));
    });

    await t.step("only", async (t) => {
      async function assertMinimumOptions(
        cb: (fns: Spy<void>[]) => void,
      ): Promise<void> {
        await assertOptions({ only: true }, cb);
      }

      async function assertAllOptions(
        cb: (fns: Spy<void>[]) => void,
      ): Promise<void> {
        await assertOptions({ ...baseOptions, only: true }, cb);
      }

      await t.step("signature 1", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.only({ name: "example" });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.only({
                name: "example",
                fn: () => {
                  assertEquals(it({ name: "a", fn: fns[0] }), undefined);
                },
                ...baseOptions,
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step(
        "signature 2",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.only("example");
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("signature 3", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.only("example", {});
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.only("example", {
                fn: () => {
                  assertEquals(it({ name: "a", fn: fns[0] }), undefined);
                },
                ...baseOptions,
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step(
        "signature 4",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.only("example", () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step(
        "signature 5",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.only(function example() {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("signature 6", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.only("example", {}, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.only("example", {
                ...baseOptions,
              }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step("signature 7", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.only({ name: "example" }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.only({
                name: "example",
                ...baseOptions,
              }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step("signature 8", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.only({}, function example() {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.only({
                ...baseOptions,
              }, function example() {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });
    });

    await t.step("ignore", async (t) => {
      async function assertMinimumOptions(
        cb: (fns: Spy<void>[]) => void,
      ): Promise<void> {
        await assertOptions({ ignore: true }, cb);
      }

      async function assertAllOptions(
        cb: (fns: Spy<void>[]) => void,
      ): Promise<void> {
        await assertOptions({ ...baseOptions, ignore: true }, cb);
      }

      await t.step("signature 1", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.ignore({ name: "example" });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.ignore({
                name: "example",
                fn: () => {
                  assertEquals(it({ name: "a", fn: fns[0] }), undefined);
                },
                ...baseOptions,
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step(
        "signature 2",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.ignore("example");
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("signature 3", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.ignore("example", {});
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.ignore("example", {
                fn: () => {
                  assertEquals(it({ name: "a", fn: fns[0] }), undefined);
                },
                ...baseOptions,
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step(
        "signature 4",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.ignore("example", () => {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step(
        "signature 5",
        async () =>
          await assertMinimumOptions((fns) => {
            const suite = describe.ignore(function example() {
              assertEquals(it({ name: "a", fn: fns[0] }), undefined);
            });
            assert(suite instanceof TestSuite);
            assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
          }),
      );

      await t.step("signature 6", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.ignore("example", {}, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.ignore("example", {
                ...baseOptions,
              }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step("signature 7", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.ignore({ name: "example" }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.ignore({
                name: "example",
                ...baseOptions,
              }, () => {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });

      await t.step("signature 8", async (t) => {
        await t.step(
          "minimum options",
          async () =>
            await assertMinimumOptions((fns) => {
              const suite = describe.ignore({}, function example() {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );

        await t.step(
          "all options",
          async () =>
            await assertAllOptions((fns) => {
              const suite = describe.ignore({
                ...baseOptions,
              }, function example() {
                assertEquals(it({ name: "a", fn: fns[0] }), undefined);
              });
              assert(suite instanceof TestSuite);
              assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
            }),
        );
      });
    });
  });
});

interface GlobalContext {
  allTimer: number;
  eachTimer: number;
}

Deno.test("global with hooks", async (t) => {
  await t.step("it", async () => {
    TestSuite.reset();
    const test = stub(Deno, "test");
    const fns = [spy(), spy()];
    let beforeAllFn, afterAllFn, beforeEachFn, afterEachFn;

    try {
      beforeAll(
        beforeAllFn = spy((context: GlobalContext) => {
          context.allTimer = setTimeout(() => {}, Number.MAX_SAFE_INTEGER);
        }),
      );
      afterAll(
        afterAllFn = spy(({ allTimer }: GlobalContext) => {
          clearTimeout(allTimer);
        }),
      );

      beforeEach(
        beforeEachFn = spy((context: GlobalContext) => {
          context.eachTimer = setTimeout(() => {}, Number.MAX_SAFE_INTEGER);
        }),
      );
      afterEach(
        afterEachFn = spy(({ eachTimer }: GlobalContext) => {
          clearTimeout(eachTimer);
        }),
      );

      assertEquals(it({ name: "example 1", fn: fns[0] }), undefined);
      assertEquals(it({ name: "example 2", fn: fns[1] }), undefined);
    } finally {
      test.restore();
    }

    assertSpyCalls(fns[0], 0);
    assertSpyCalls(fns[1], 0);

    const call = assertSpyCall(test, 0);
    const options = call.args[0] as Deno.TestDefinition;
    assertEquals(Object.keys(options).sort(), ["fn", "name"]);
    assertEquals(options.name, "global");

    const time = new FakeTime();
    try {
      const context = new TestContext();
      const result = options.fn(context);
      assertStrictEquals(Promise.resolve(result), result);
      assertEquals(await result, undefined);
      assertSpyCalls(context.spies.step, 2);
    } finally {
      time.restore();
    }

    let fn = fns[0];
    assertSpyCall(fn, 0, {
      self: undefined,
      args: [{ allTimer: 1, eachTimer: 2 }],
      returned: undefined,
    });
    assertSpyCalls(fn, 1);

    fn = fns[1];
    assertSpyCall(fn, 0, {
      self: undefined,
      args: [{ allTimer: 1, eachTimer: 3 }],
      returned: undefined,
    });
    assertSpyCalls(fn, 1);

    assertSpyCalls(beforeAllFn, 1);
    assertSpyCalls(afterAllFn, 1);
    assertSpyCalls(beforeEachFn, 2);
    assertSpyCalls(afterEachFn, 2);
  });
});
