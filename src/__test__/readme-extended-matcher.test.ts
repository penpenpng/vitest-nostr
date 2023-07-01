import "..";

import { expect, test } from "vitest";

test("It is REQ message", () => {
  // Tests if it is an REQ message.
  // We are not interested in the specifics of the message now.
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ();
});

test("It is REQ message with specified subId", () => {
  // We are now only interested in subId matching.
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ("sub1");
});

test("It is specified REQ message", () => {
  // We are interested in the complete REQ message.
  expect(["REQ", "sub1", { kinds: [1] }]).beToRelayREQ([
    "sub1",
    { kinds: [1] },
  ]);

  // or just you can use toEqual() matcher.
});
