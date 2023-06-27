import * as Nostr from "nostr-typedef";

export const faker = {
  filter(filter?: Nostr.Filter): Nostr.Filter {
    return filter ?? { kinds: [0] };
  },
  filters(): Nostr.Filter[] {
    return [faker.filter()];
  },
  event<const K extends number>(
    event?: Partial<Nostr.Event<K>>
  ): Nostr.Event<K> {
    return {
      id: "*",
      content: "*",
      created_at: 0,
      kind: 0 as K,
      pubkey: "*",
      sig: "*",
      tags: [],
      ...event,
    };
  },
  AUTH(
    event?: Partial<Nostr.Event<Nostr.Kind.ClientAuthentication>>
  ): Nostr.ToRelayMessage.AUTH {
    return [
      "AUTH",
      { ...faker.event(event), kind: Nostr.Kind.ClientAuthentication },
    ];
  },
  CLOSE(subId: string): Nostr.ToRelayMessage.CLOSE {
    return ["CLOSE", subId];
  },
  COUNT(subId: string, filters?: Nostr.Filter[]): Nostr.ToRelayMessage.COUNT {
    return ["COUNT", subId, ...(filters ?? faker.filters())];
  },
  EVENT(event?: Partial<Nostr.Event>): Nostr.ToRelayMessage.EVENT {
    return ["EVENT", faker.event(event)];
  },
  REQ(subId: string, filters?: Nostr.Filter[]): Nostr.ToRelayMessage.REQ {
    return ["REQ", subId, ...(filters ?? faker.filters())];
  },
  toClientMessage: {
    AUTH(message?: string): Nostr.ToClientMessage.AUTH {
      return ["AUTH", message ?? "*"];
    },
    COUNT(subId: string, count?: number): Nostr.ToClientMessage.COUNT {
      return ["COUNT", subId, { count: count ?? 0 }];
    },
    EOSE(subId: string): Nostr.ToClientMessage.EOSE {
      return ["EOSE", subId];
    },
    EVENT(
      subId: string,
      event?: Partial<Nostr.Event>
    ): Nostr.ToClientMessage.EVENT {
      return ["EVENT", subId, faker.event(event)];
    },
    NOTICE(message?: string): Nostr.ToClientMessage.NOTICE {
      return ["NOTICE", message ?? "*"];
    },
    OK(
      eventId: string,
      succeeded: boolean,
      message?: string
    ): Nostr.ToClientMessage.OK {
      return ["OK", eventId, succeeded, message ?? "*"];
    },
  },
};
