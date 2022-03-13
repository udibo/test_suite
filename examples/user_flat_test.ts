import { describe, it } from "../mod.ts";
import { assertEquals } from "../test_deps.ts";
import { getUser, resetUsers, User } from "./user.ts";

interface UserContext {
  user: User;
}

const userSuite = describe({
  name: "user",
  beforeEach(this: UserContext) {
    this.user = new User("Kyle June");
  },
  afterEach() {
    resetUsers();
  },
});

it(userSuite, "create", () => {
  const user = new User("John Doe");
  assertEquals(user.name, "John Doe");
});

const getUserSuite = describe({
  name: "getUser",
  suite: userSuite,
});

it(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

it(getUserSuite, "user exists", function (this: UserContext) {
  assertEquals(getUser("Kyle June"), this.user);
});

it(userSuite, "resetUsers", function (this: UserContext) {
  assertEquals(getUser("Kyle June"), this.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
