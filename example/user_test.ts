import { TestSuite, test } from "../mod.ts";
import { assertEquals } from "../deps/std/testing/asserts.ts";
import { User, getUser, resetUsers } from "./user.ts";

interface UserContext {
  user: User;
}
const userSuite: TestSuite<UserContext> = new TestSuite({
  name: "user",
  beforeEach(context: UserContext) {
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

interface GetUserContext extends UserContext {
  value?: number;
}

const getUserSuite: TestSuite<GetUserContext> = new TestSuite<GetUserContext>({
  name: "getUser",
  suite: userSuite,
});

test(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

test(getUserSuite, "user exists", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
});

test(userSuite, "resetUsers", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
