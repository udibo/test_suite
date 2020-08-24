export class User {
  constructor(public name: string) {
    users.set(name, this);
  }
}

const users: Map<string, User> = new Map();

export function getUser(name: string): User | void {
  return users.get(name);
}

export function resetUsers(): void {
  users.clear();
}
