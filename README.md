# vitest-nostr

vitest utilities for Nostr client, including faker, extended matcher, and relay mock.

## Installation

```
npm install -D vitest vitest-websocket-mock vitest-nostr
```

## Examples

## Faker

```ts
import { faker } from "vitest-nostr";

// Get dummy event object.
faker.event();

// You can specify some values.
faker.event({ kind: 1 });
```

See [faker.ts](./src/faker.ts) for a complete list of objects supported.

## Extended Matcher

```ts
import "vitest-nostr"; // needed to extend matcher.
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
```

See [matcher.ts](./src/matcher.ts) for a complete list of extended matchers.

## Relay Mock

[readme.test.ts](./src/__test__/readme-relay-mock.test.ts)

```ts
import { expect, test, beforeEach, afterEach } from "vitest";
import { createMockRelay, faker, type MockRelay } from "vitest-nostr";

let relay: MockRelay;
let client: WebSocket;

beforeEach(async () => {
  relay = createMockRelay("ws://localhost:1234");
  client = new WebSocket("ws://localhost:1234");

  await relay.connected;
});

afterEach(() => {
  relay.close();
  client.close();
});

test("Client can send REQ", async () => {
  client.send(JSON.stringify(["REQ", "sub1", { kinds: [1] }]));
  await expect(relay).toReceiveREQ();
});

test("Client can send REQ with specified subId", async () => {
  client.send(JSON.stringify(["REQ", "sub1", { kinds: [1] }]));
  await expect(relay).toReceiveREQ("sub1");
});

test("Client can send specified REQ", async () => {
  const REQ = ["REQ", "sub1", { kinds: [1] }];

  client.send(JSON.stringify(REQ));

  const received = await relay.next();
  await expect(received).beToRelayREQ(["sub1", { kinds: [1] }]);

  // or you can just use toReceiveMessage() provided by vitest-websocket-mock
});

test("Client can receive message", async () => {
  let resolver = () => {
    /* */
  };
  const promise = new Promise<void>((resolve) => {
    resolver = resolve;
  });

  client.onmessage = ({ data }) => {
    expect(JSON.parse(data)).beToClientEVENT();
    client.onmessage = null;
    resolver();
  };

  // Wait until the relay establishes one connection,
  // then get the socket on the relay side.
  const [socket] = await relay.waitConnected(1);
  // When you have multiple connections,
  // you will get a list of the order in which they are connected.

  // Send message to client.
  socket.send(faker.toClientMessage.EVENT("sub1"));

  // Wait for onmessage callback.
  return promise;
});

test("Client can REQ and CLOSE", async () => {
  client.send(JSON.stringify(faker.REQ("sub1")));
  await expect(relay).toReceiveREQ();

  // If the mock relay has already received the REQ,
  // the relay will automatically determine where to deliver the EVENT, based on given subId.
  relay.emitEVENT("sub1");

  // ditto
  relay.emitEOSE("sub1");

  // It is expected that client receive EVENT and EOSE!
});
```
