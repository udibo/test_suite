export {
  assert,
  assertEquals,
  AssertionError,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@0.130.0/testing/asserts.ts";

export {
  assertSpyCall,
  assertSpyCalls,
  spy,
  stub,
} from "https://deno.land/x/mock@0.15.0/mod.ts";
export type {
  Spy,
  SpyCall,
  Stub,
} from "https://deno.land/x/mock@0.15.0/mod.ts";
