import type { MatcherState, RawMatcherFn } from "@vitest/expect";
import Nostr from "nostr-typedef";
import { expect } from "vitest";
import { deriveToReceiveMessage } from "vitest-websocket-mock";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

interface CustomMatchers<R = unknown> {
  beToRelayAUTH(): void;
  beToRelayAUTH(
    event: Partial<Nostr.Event<Nostr.Kind.ClientAuthentication>>
  ): void;
  beToRelayCLOSE(): void;
  beToRelayCLOSE(subId: string): void;
  beToRelayCOUNT(): void;
  beToRelayCOUNT(subId: string): void;
  beToRelayCOUNT(expected: [subId: string, ...filters: Nostr.Filter[]]): void;
  beToRelayEVENT(): void;
  beToRelayEVENT(event: Partial<Nostr.Event>): void;
  beToRelayREQ(): void;
  beToRelayREQ(subId: string): void;
  beToRelayREQ(expected: [subId: string, ...filters: Nostr.Filter[]]): void;

  beToClientAUTH(): void;
  beToClientAUTH(challengeMessage: string): void;
  beToClientCOUNT(): void;
  beToClientCOUNT(subId: string): void;
  beToClientCOUNT(expected: [subId: string, count: number]): void;
  beToClientEOSE(): void;
  beToClientEOSE(subId: string): void;
  beToClientEVENT(): void;
  beToClientEVENT(subId: string): void;
  beToClientEVENT(expected: [subId: string, event: Partial<Nostr.Event>]): void;
  beToClientNOTICE(): void;
  beToClientNOTICE(message: string): void;
  beToClientOK(
    expected: [eventId: string, succeeded: boolean, message?: string]
  ): void;

  toReceiveAUTH(): Promise<void>;
  toReceiveAUTH(
    event: Partial<Nostr.Event<Nostr.Kind.ClientAuthentication>>
  ): Promise<void>;
  toReceiveCLOSE(): Promise<void>;
  toReceiveCLOSE(subId: string): Promise<void>;
  toReceiveCOUNT(): Promise<void>;
  toReceiveCOUNT(subId: string): Promise<void>;
  toReceiveCOUNT(
    expected: [subId: string, ...filters: Nostr.Filter[]]
  ): Promise<void>;
  toReceiveEVENT(): Promise<void>;
  toReceiveEVENT(event: Partial<Nostr.Event>): Promise<void>;
  toReceiveREQ(): Promise<void>;
  toReceiveREQ(subId: string): Promise<void>;
  toReceiveREQ(
    expected: [subId: string, ...filters: Nostr.Filter[]]
  ): Promise<void>;
}

const beToRelayAUTH: RawMatcherFn = function (
  actual,
  event?: Partial<Nostr.Event<Nostr.Kind.ClientAuthentication>>
) {
  const pass =
    isNostrMessage("AUTH", actual) &&
    (event === undefined ||
      matchEvent(actual[1], event, this.equals.bind(this)));

  return {
    message: message(
      "a to-relay-AUTH message",
      ["AUTH", event ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToRelayCLOSE: RawMatcherFn = function (actual, subId?: string) {
  const pass =
    isNostrMessage("CLOSE", actual) &&
    (subId === undefined || actual[1] === subId);

  return {
    message: message(
      "a to-relay-CLOSE message",
      ["CLOSE", subId ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToRelayCOUNT: RawMatcherFn = function (
  actual,
  pred?: string | [subId: string, ...filters: Nostr.Filter[]]
) {
  const subId =
    typeof pred === "string" ? pred : pred !== undefined ? pred[0] : null;
  const filters =
    typeof pred === "object" && pred !== undefined ? pred.slice(1) : null;

  const pass =
    isNostrMessage("COUNT", actual) &&
    (subId === null || actual[1] === subId) &&
    (filters === null || this.equals(actual.slice(2), filters));

  return {
    message: message(
      "a to-relay-COUNT message",
      ["COUNT", subId ?? "*", ...(filters === null ? ["*"] : filters)],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToRelayEVENT: RawMatcherFn = function (
  actual,
  event?: Partial<Nostr.Event>
) {
  const pass =
    isNostrMessage("EVENT", actual) &&
    (event === undefined ||
      matchEvent(actual[1], event, this.equals.bind(this)));

  return {
    message: message(
      "a to-relay-EVENT message",
      ["EVENT", event ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToRelayREQ: RawMatcherFn = function (
  actual,
  pred?: string | [subId: string, ...filters: Nostr.Filter[]]
) {
  const subId =
    typeof pred === "string" ? pred : pred !== undefined ? pred[0] : null;
  const filters =
    typeof pred === "object" && pred !== undefined ? pred.slice(1) : null;

  const pass =
    isNostrMessage("REQ", actual) &&
    (subId === null || actual[1] === subId) &&
    (filters === null || this.equals(actual.slice(2), filters));

  return {
    message: message(
      "a to-relay-REQ message",
      ["REQ", subId ?? "*", ...(filters === null ? ["*"] : filters)],
      this,
      actual,
      pass
    ),
    pass,
  };
};

const toReceiveAUTH = deriveToReceiveMessage("toReceiveAUTH", beToRelayAUTH);
const toReceiveCLOSE = deriveToReceiveMessage("toReceiveCLOSE", beToRelayCLOSE);
const toReceiveCOUNT = deriveToReceiveMessage("toReceiveCOUNT", beToRelayCOUNT);
const toReceiveEVENT = deriveToReceiveMessage("toReceiveEVENT", beToRelayEVENT);
const toReceiveREQ = deriveToReceiveMessage("toReceiveREQ", beToRelayREQ);

const beToClientAUTH: RawMatcherFn = function (
  actual,
  challengeMessage?: string
) {
  const pass =
    isNostrMessage("AUTH", actual) &&
    (challengeMessage === undefined || actual[1] === challengeMessage);

  return {
    message: message(
      "a to-client-AUTH message",
      ["AUTH", challengeMessage ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToClientCOUNT: RawMatcherFn = function (
  actual,
  pred?: string | [subId: string, count: number]
) {
  const subId =
    typeof pred === "string" ? pred : pred !== undefined ? pred[0] : null;
  const count = typeof pred === "object" && pred !== undefined ? pred[1] : null;

  const pass =
    isNostrMessage("COUNT", actual) &&
    (subId === null || actual[1] === subId) &&
    (count === null || this.equals(actual[2], { count }));

  return {
    message: message(
      "a to-client-COUNT message",
      ["COUNT", subId ?? "*", count === null ? "*" : { count }],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToClientEOSE: RawMatcherFn = function (actual, subId?: string) {
  const pass =
    isNostrMessage("EOSE", actual) &&
    (subId === undefined || actual[1] === subId);

  return {
    message: message(
      "a to-client-EOSE message",
      ["COUNT", subId ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToClientEVENT: RawMatcherFn = function (
  actual,
  pred?: string | [subId: string, event: Partial<Nostr.Event>]
) {
  const subId =
    typeof pred === "string" ? pred : pred !== undefined ? pred[0] : null;
  const event = typeof pred === "object" && pred !== undefined ? pred[1] : null;

  const pass =
    isNostrMessage("EVENT", actual) &&
    (subId === null || actual[1] === subId) &&
    (event === null || matchEvent(actual[2], event, this.equals.bind(this)));

  return {
    message: message(
      "a to-client-EVENT message",
      ["EVENT", subId ?? "*", event ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToClientNOTICE: RawMatcherFn = function (
  actual,
  noticeMessage?: string
) {
  const pass =
    isNostrMessage("NOTICE", actual) &&
    (noticeMessage === undefined || actual[1] === noticeMessage);

  return {
    message: message(
      "a to-client-NOTICE message",
      ["EVENT", noticeMessage ?? "*"],
      this,
      actual,
      pass
    ),
    pass,
  };
};
const beToClientOK: RawMatcherFn = function (
  actual,
  expected?: [eventId: string, succeeded: boolean, message?: string]
) {
  const pass =
    isNostrMessage("OK", actual) &&
    (expected === undefined ||
      (actual[1] === expected[0] &&
        actual[2] === expected[1] &&
        (expected[2] === undefined || actual[3] === expected[2])));

  return {
    message: message(
      "a to-client-OK message",
      ["OK", ...(expected ?? ["*", "*", "*"])],
      this,
      actual,
      pass
    ),
    pass,
  };
};

expect.extend({
  beToRelayAUTH,
  beToRelayCLOSE,
  beToRelayCOUNT,
  beToRelayEVENT,
  beToRelayREQ,

  beToClientAUTH,
  beToClientCOUNT,
  beToClientEOSE,
  beToClientEVENT,
  beToClientNOTICE,
  beToClientOK,

  toReceiveAUTH,
  toReceiveCLOSE,
  toReceiveCOUNT,
  toReceiveEVENT,
  toReceiveREQ,
});

function isNostrMessage<
  T extends Nostr.ToClientMessage.Any[0] | Nostr.ToRelayMessage.Any[0]
>(type: T, message: unknown): message is [T, ...unknown[]] {
  return Array.isArray(message) && message[0] === type;
}

function matchEvent(
  received: unknown,
  expected: Partial<Nostr.Event>,
  equal: (a: unknown, b: unknown) => boolean
): boolean {
  const eventKeys = [
    "id",
    "sig",
    "kind",
    "tags",
    "pubkey",
    "content",
    "created_at",
  ] as const;
  const isEvent = (x: unknown): x is Nostr.Event =>
    typeof x === "object" && x !== null && eventKeys.every((key) => key in x);

  return (
    isEvent(received) &&
    eventKeys.every(
      (key) =>
        expected[key] === undefined || equal(received[key], expected[key])
    )
  );
}

function message(
  entityName: string,
  expected: unknown,
  state: MatcherState,
  actual: unknown,
  pass: boolean
) {
  return () =>
    `It was expected ${
      pass ? "not " : ""
    }to be ${entityName}, like this:\n\n${state.utils.printExpected(
      expected
    )}\n\nbut got:\n\n${state.utils.printReceived(actual)}\n`;
}
