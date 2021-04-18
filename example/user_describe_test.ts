import { afterEach, beforeEach, describe, it } from "../mod.ts";
import { assertEquals } from "../deps/std/testing/asserts.ts";
import { getUser, resetUsers, User } from "./user.ts";

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
