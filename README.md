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

vitest-nostr provides extended matchers for common data types exchanged over the Nostr protocol.

```ts
import "vitest-nostr"; // needed to extend matcher.
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
```

See [matcher.ts](./src/matcher.ts) for a complete list of extended matchers.

## Relay Mock

`createMockRelay()` provides an imitation of a relay.
You can test what messages your real WebSocket on the client side sends to the (mock) relay, and whether the client behaves ideally when the (mock) relay sends a particular message to the client.

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

  // Wait until the relay establishes the first connection,
  // then get the socket on the relay side.
  const socket = await relay.getSocket(0);
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

## Client Spy

`createClientSpy()` allows you to test whether your client, or more precisely, your any callback function that may receive [Nostr.ToClientMessage.Any](https://github.com/penpenpng/nostr-typedef/blob/main/index.d.ts#L101), is actually receiving the desired message.

```ts
import { afterEach, beforeEach, expect, test } from "vitest";

import {
  type ClientSpy,
  createClientSpy,
  createMockRelay,
  type MockRelay,
} from "vitest-nostr";

let relay: MockRelay;
let client: WebSocket;
let spy: ClientSpy;

beforeEach(async () => {
  relay = createMockRelay("ws://localhost:1234");
  client = new WebSocket("ws://localhost:1234");

  spy = createClientSpy((listener) => {
    client.addEventListener("message", ({ data }) =>
      listener(JSON.parse(data))
    );
  });

  await relay.connected;
});

afterEach(() => {
  relay.close();
  client.close();
  spy.dispose();
});

test("Client can send REQ", async () => {
  relay.emit(["NOTICE", "Hello, client!"]);
  await expect(spy).toSeeNOTICE("Hello, client!");
});
```
