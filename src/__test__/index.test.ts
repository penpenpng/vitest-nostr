import "../matcher";

import * as Nostr from "nostr-typedef";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { faker } from "../faker";
import { createMockRelay, MockRelay, MockServerSocket } from "../mock";
import { createMockClient, type MockClient } from "./helper";

describe("Faker", () => {
  test("can provide fake to-relay-AUTH message", () => {
    expect(faker.AUTH()).beToRelayAUTH();
    expect(faker.AUTH({ kind: Nostr.Kind.ClientAuthentication })).beToRelayAUTH(
      { kind: Nostr.Kind.ClientAuthentication }
    );
  });
  test("can provide fake to-relay-CLOSE message", () => {
    expect(faker.CLOSE("x")).beToRelayCLOSE("x");
  });
  test("can provide fake to-relay-COUNT message", () => {
    expect(faker.COUNT("x")).beToRelayCOUNT("x");
    expect(faker.COUNT("x", faker.filters())).beToRelayCOUNT([
      "x",
      ...faker.filters(),
    ]);
  });
  test("can provide fake to-relay-EVENT message", () => {
    expect(faker.EVENT()).beToRelayEVENT();
    expect(faker.EVENT({ kind: 1 })).beToRelayEVENT({ kind: 1 });
  });
  test("can provide fake to-relay-REQ message", () => {
    expect(faker.REQ("x")).beToRelayREQ("x");
    expect(faker.REQ("x", faker.filters())).beToRelayREQ([
      "x",
      ...faker.filters(),
    ]);
  });

  test("can provide fake to-client-AUTH message", () => {
    expect(faker.toClientMessage.AUTH()).beToClientAUTH();
    expect(faker.toClientMessage.AUTH("x")).beToClientAUTH("x");
  });
  test("can provide fake to-client-COUNT message", () => {
    expect(faker.toClientMessage.COUNT("x")).beToClientCOUNT();
    expect(faker.toClientMessage.COUNT("x", 10)).beToClientCOUNT(["x", 10]);
  });
  test("can provide fake to-client-EOSE message", () => {
    expect(faker.toClientMessage.EOSE("x")).beToClientEOSE("x");
  });
  test("can provide fake to-client-EVENT message", () => {
    expect(faker.toClientMessage.EVENT("x")).beToClientEVENT("x");
    expect(faker.toClientMessage.EVENT("x", { kind: 1 })).beToClientEVENT([
      "x",
      { kind: 1 },
    ]);
  });
  test("can provide fake to-client-NOTICE message", () => {
    expect(faker.toClientMessage.NOTICE()).beToClientNOTICE();
    expect(faker.toClientMessage.NOTICE("x")).beToClientNOTICE("x");
  });
  test("can provide fake to-client-OK message", () => {
    expect(faker.toClientMessage.OK("x", true)).beToClientOK(["x", true]);
    expect(faker.toClientMessage.OK("x", true, "x")).beToClientOK([
      "x",
      true,
      "x",
    ]);
  });
});

describe("Message matcher", () => {
  test("can test to-relay-AUTH message", () => {
    expect(["AUTH", faker.event()]).beToRelayAUTH();
    expect(["AUTH", faker.event({ id: "1" })]).beToRelayAUTH({ id: "1" });
    expect(["AUTH", faker.event({ id: "1" })]).not.beToRelayAUTH({ id: "2" });
    expect(0).not.beToRelayAUTH();
    expect(() => expect(0).beToRelayAUTH()).toThrowErrorMatchingInlineSnapshot(`
      "It was expected to be a to-relay-AUTH message, like this:

      [32mArray [
        \\"AUTH\\",
        \\"*\\",
      ][39m

      but got:

      [31m0[39m
      "
    `);
  });
  test("can test to-relay-CLOSE message", () => {
    expect(["CLOSE", "x"]).beToRelayCLOSE();
    expect(["CLOSE", "x"]).beToRelayCLOSE("x");
    expect(["CLOSE", "x"]).not.beToRelayCLOSE("y");
    expect(0).not.beToRelayCLOSE();
    expect(() => expect(0).beToRelayCLOSE())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-relay-CLOSE message, like this:

        [32mArray [
          \\"CLOSE\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-relay-COUNT message", () => {
    expect(["COUNT", "x"]).beToRelayCOUNT();
    expect(["COUNT", "x"]).beToRelayCOUNT("x");
    expect(["COUNT", "x"]).not.beToRelayCOUNT("y");
    expect(0).not.beToRelayCOUNT();
    expect(() => expect(0).beToRelayCOUNT())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-relay-COUNT message, like this:

        [32mArray [
          \\"COUNT\\",
          \\"*\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-relay-EVENT message", () => {
    expect(["EVENT", faker.event()]).beToRelayEVENT();
    expect(["EVENT", faker.event({ kind: 1 })]).beToRelayEVENT({ kind: 1 });
    expect(["EVENT", faker.event({ kind: 1 })]).not.beToRelayEVENT({ kind: 2 });
    expect(0).not.beToRelayEVENT();
    expect(() => expect(0).beToRelayEVENT())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-relay-EVENT message, like this:

        [32mArray [
          \\"EVENT\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-relay-REQ message", () => {
    expect(["REQ", "x", ...faker.filters()]).beToRelayREQ();
    expect(["REQ", "x", ...faker.filters()]).beToRelayREQ("x");
    expect(["REQ", "x", ...faker.filters()]).beToRelayREQ([
      "x",
      ...faker.filters(),
    ]);
    expect([0, "x", ...faker.filters()]).not.beToRelayREQ();
    expect(["REQ", "x", ...faker.filters()]).not.beToRelayREQ("y");
    expect(0).not.beToRelayREQ();
    expect(() => expect(0).beToRelayREQ()).toThrowErrorMatchingInlineSnapshot(`
      "It was expected to be a to-relay-REQ message, like this:

      [32mArray [
        \\"REQ\\",
        \\"*\\",
        \\"*\\",
      ][39m

      but got:

      [31m0[39m
      "
    `);
  });

  test("can test to-client-AUTH message", () => {
    expect(["AUTH", "x"]).beToClientAUTH();
    expect(["AUTH", "x"]).beToClientAUTH("x");
    expect(["AUTH", "x"]).not.beToClientAUTH("y");
    expect(0).not.beToClientAUTH();
    expect(() => expect(0).beToClientAUTH())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-client-AUTH message, like this:

        [32mArray [
          \\"AUTH\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-client-COUNT message", () => {
    expect(["COUNT", "x", { count: 10 }]).beToClientCOUNT();
    expect(["COUNT", "x", { count: 10 }]).beToClientCOUNT("x");
    expect(["COUNT", "x", { count: 10 }]).beToClientCOUNT(["x", 10]);
    expect(["COUNT", "x", { count: 10 }]).not.beToClientCOUNT("y");
    expect(["COUNT", "x", { count: 10 }]).not.beToClientCOUNT(["x", 20]);
    expect(0).not.beToClientCOUNT();
    expect(() => expect(0).beToClientCOUNT())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-client-COUNT message, like this:

        [32mArray [
          \\"COUNT\\",
          \\"*\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-client-EOSE message", () => {
    expect(["EOSE", "x"]).beToClientEOSE();
    expect(["EOSE", "x"]).beToClientEOSE("x");
    expect(["EOSE", "x"]).not.beToClientEOSE("y");
    expect(0).not.beToClientEOSE();
    expect(() => expect(0).beToClientEOSE())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-client-EOSE message, like this:

        [32mArray [
          \\"COUNT\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-client-EVENT message", () => {
    expect(["EVENT", "x", faker.event()]).beToClientEVENT();
    expect(["EVENT", "x", faker.event({ kind: 1 })]).beToClientEVENT("x");
    expect(["EVENT", "x", faker.event({ kind: 1 })]).not.beToClientEVENT([
      "x",
      { kind: 2 },
    ]);
    expect(0).not.beToClientEVENT();
    expect(() => expect(0).beToClientEVENT())
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-client-EVENT message, like this:

        [32mArray [
          \\"EVENT\\",
          \\"*\\",
          \\"*\\",
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
  test("can test to-client-OK message", () => {
    expect(["OK", "x", true]).beToClientOK(["x", true]);
    expect(["OK", "x", true, "x"]).beToClientOK(["x", true, "x"]);
    expect(["OK", "x", true]).not.beToClientOK(["y", true]);
    expect(["OK", "x", true]).not.beToClientOK(["x", false]);
    expect(["OK", "x", true, "x"]).not.beToClientOK(["x", true, "y"]);
    expect(0).not.beToClientOK(["x", true]);
    expect(() => expect(0).beToClientOK(["x", true]))
      .toThrowErrorMatchingInlineSnapshot(`
        "It was expected to be a to-client-OK message, like this:

        [32mArray [
          \\"OK\\",
          \\"x\\",
          true,
        ][39m

        but got:

        [31m0[39m
        "
      `);
  });
});

describe("Relay mock", () => {
  const RELAY_URL = "ws://localhost:1234";
  let relay: MockRelay;
  let client: MockClient;

  beforeEach(async () => {
    relay = createMockRelay(RELAY_URL);
    client = createMockClient(RELAY_URL);

    await relay.connected;
  });

  afterEach(() => {
    relay.close();
    client.dispose();
  });

  test("can receive and test AUTH message", async () => {
    client.send(faker.AUTH());
    await expect(relay).toReceiveAUTH();
  });
  test("can test simple REQ subscription scenario", async () => {
    client.send(faker.REQ("x"));
    await expect(relay).toReceiveREQ();

    relay.emitEVENT("x");
    expect(await client.next()).beToClientEVENT("x");
    relay.emitEVENT("x");
    expect(async () => expect(await client.next()).beToClientEVENT("y")).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "It was expected to be a to-client-EVENT message, like this:

      [32mArray [
        \\"EVENT\\",
        \\"y\\",
        \\"*\\",
      ][39m

      but got:

      [31mArray [
        \\"EVENT\\",
        \\"x\\",
        Object {
          \\"content\\": \\"*\\",
          \\"created_at\\": 0,
          \\"id\\": \\"*\\",
          \\"kind\\": 0,
          \\"pubkey\\": \\"*\\",
          \\"sig\\": \\"*\\",
          \\"tags\\": Array [],
        },
      ][39m
      "
    `);

    relay.emitEOSE("x");
    expect(await client.next()).beToClientEOSE("x");

    client.send(faker.CLOSE("x"));
    await expect(relay).toReceiveCLOSE();
  });
  test("can test multiple REQ subscription scenario", async () => {
    client.send(faker.REQ("x"));
    await expect(relay).toReceiveREQ("x");

    relay.emitEVENT("x");
    expect(await client.next()).beToClientEVENT("x");

    client.send(faker.REQ("y"));
    await expect(relay).toReceiveREQ("y");

    relay.emitEVENT("x");
    expect(await client.next()).beToClientEVENT("x");
    relay.emitEVENT("y");
    expect(await client.next()).beToClientEVENT("y");

    client.send(faker.CLOSE("y"));
    await expect(relay).toReceiveCLOSE("y");

    relay.emitEVENT("x");
    expect(await client.next()).beToClientEVENT("x");

    client.send(faker.CLOSE("x"));
    await expect(relay).toReceiveCLOSE("x");
  });
  test("can test simple COUNT subscription scenario", async () => {
    client.send(faker.COUNT("x"));
    await expect(relay).toReceiveCOUNT();

    relay.emitCOUNT("x");
    expect(await client.next()).beToClientCOUNT("x");
  });
});

describe("Relay mock with multiple sockets", () => {
  const RELAY_URL = "ws://localhost:1234";
  let relay: MockRelay;
  let client1: MockClient;
  let client2: MockClient;
  let socket1: MockServerSocket;
  let socket2: MockServerSocket;

  beforeEach(async () => {
    relay = createMockRelay(RELAY_URL);

    client1 = createMockClient(RELAY_URL);
    client2 = createMockClient(RELAY_URL);

    await relay.connected;

    [socket1, socket2] = await relay.waitConnected(2);
  });

  afterEach(() => {
    relay.close();
    client1.dispose();
    client2.dispose();
  });

  test("can send NOTICE messages to specified client", async () => {
    relay.emit(["NOTICE", "Hello client1"], socket1);
    expect(await client1.next()).beToClientNOTICE("Hello client1");

    relay.emit(["NOTICE", "Hello client2"], socket2);
    expect(await client2.next()).beToClientNOTICE("Hello client2");
  });
  test("can test", async () => {
    client1.send(faker.REQ("x1"));
    await expect(relay).toReceiveREQ("x1");

    client2.send(faker.REQ("x2"));
    await expect(relay).toReceiveREQ("x2");

    client1.send(faker.REQ("common"));
    client2.send(faker.REQ("common"));
    await expect(relay).toReceiveREQ("common");
    await expect(relay).toReceiveREQ("common");

    // NOTICE
    relay.emit(["NOTICE", "Hello client1"], socket1);
    expect(await client1.next()).beToClientNOTICE("Hello client1");

    relay.emit(["NOTICE", "Hello client2"], socket2);
    expect(await client2.next()).beToClientNOTICE("Hello client2");

    // EVENT
    relay.emitEVENT("x1");
    expect(await client1.next()).beToClientEVENT("x1");

    relay.emitEVENT("x2");
    expect(await client2.next()).beToClientEVENT("x2");

    relay.emitEVENT("common");
    expect(await client1.next()).beToClientEVENT("common");
    expect(await client2.next()).beToClientEVENT("common");

    // EOSE
    relay.emitEOSE("x1");
    expect(await client1.next()).beToClientEOSE("x1");

    relay.emitEOSE("x2");
    expect(await client2.next()).beToClientEOSE("x2");

    relay.emitEOSE("common");
    expect(await client1.next()).beToClientEOSE("common");
    expect(await client2.next()).beToClientEOSE("common");
  });
});
