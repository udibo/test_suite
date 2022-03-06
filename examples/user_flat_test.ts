import { describe, it } from "../mod.ts";
import { assertEquals } from "../test_deps.ts";
import { getUser, resetUsers, User } from "./user.ts";

interface UserContext {
  user: User;
}

const userSuite = describe({
  name: "user",
  beforeEach(context: UserContext) {
    context.user = new User("Kyle June");
  },
  afterEach() {
    resetUsers();
  },
});

it(userSuite, "create", () => {
  const user = new User("John Doe");
  assertEquals(user.name, "John Doe");
});

interface GetUserContext extends UserContext {
  value?: number;
}

const getUserSuite = describe<GetUserContext>({
  name: "getUser",
  suite: userSuite,
});

it(getUserSuite, "user does not exist", () => {
  assertEquals(getUser("John Doe"), undefined);
});

it(getUserSuite, "user exists", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
});

it(userSuite, "resetUsers", (context: UserContext) => {
  assertEquals(getUser("Kyle June"), context.user);
  resetUsers();
  assertEquals(getUser("Kyle June"), undefined);
});
