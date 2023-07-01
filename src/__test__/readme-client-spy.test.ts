import { afterEach, beforeEach, expect, test } from "vitest";

import {
  type ClientSpy,
  createClientSpy,
  createMockRelay,
  type MockRelay,
} from "..";

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
