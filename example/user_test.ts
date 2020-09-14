import { TestSuite, test } from "../mod.ts";
import { assertEquals } from "../deps/std/testing/asserts.ts";
import { User, getUser, resetUsers } from "./user.ts";

interface UserSuiteContext {
  user: User;
}
const userSuite: TestSuite<UserSuiteContext> = new TestSuite({
  name: "user",
  beforeEach(context: UserSuiteContext) {
    context.user = new User("Kyle June");
  },
  afterEach() {
    resetUsers();
  },
});

test(userSuite, "create", () => {
  const user = new User("John Doe");
  assertEquals(user.name, "John Doe");
});

interface GetUserSuiteContext extends UserSuiteContext {
  value?: number;
}

const getUserSuite: TestSuite<GetUserSuiteContext> = new TestSuite({
  name: "getUser",
  suite: userSuite,
});

test(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

test(getUserSuite, "user exists", (context: UserSuiteContext) => {
  assertEquals(getUser("Kyle June"), context.user);
});

test(userSuite, "resetUsers", (context: UserSuiteContext) => {
  assertEquals(getUser("Kyle June"), context.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
