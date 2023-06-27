import "..";

import { expect, test } from "vitest";

test("It is REQ message", () => {
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ();
});

test("It is REQ message with specified subId", () => {
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ("sub1");
});

test("It is specified REQ message", () => {
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ([
    "sub1",
    { kinds: [1] },
  ]);

  // or just you can use toEqual() matcher.
});
