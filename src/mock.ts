import { CloseOptions } from "mock-socket";
import Nostr from "nostr-typedef";
import { WS } from "vitest-websocket-mock";

import { faker } from "./faker";
import { withTimeout } from "./utils";

export interface MockServerSocket {
  id: number;
  send(message: unknown): void;
  close(options?: CloseOptions): void;
}

export interface MockServerBehavior {
  onOpen?(socket: MockServerSocket): void;
  onMessage?(socket: MockServerSocket, message: string): void;
  onClose?(socket: MockServerSocket): void;
  onError?(socket: MockServerSocket, error: Error): void;
}

interface MockServer extends WS {
  getSockets: (count: number) => Promise<MockServerSocket[]>;
  getSocket: (index: number) => Promise<MockServerSocket>;
}

export function createMockServer(
  url: string,
  behavior: MockServerBehavior
): MockServer {
  const server = new WS(url, { jsonProtocol: true });
  const sockets: MockServerSocket[] = [];
  let nextId = 1;

  server.on("connection", (_socket) => {
    const socket: MockServerSocket = {
      id: nextId++,
      send(message) {
        if (_socket.readyState !== WebSocket.OPEN) {
          return;
        }

        _socket.send(
          typeof message === "string" ? message : `${JSON.stringify(message)}`
        );
      },
      close(options) {
        _socket.close(options);
      },
    };

    sockets.push(socket);
    behavior.onOpen?.(socket);

    _socket.on("message", (message) => {
      if (typeof message !== "string") {
        throw new Error("Unexpected type message");
      }
      behavior.onMessage?.(socket, message);
    });

    _socket.on("close", () => {
      behavior.onClose?.(socket);
    });

    _socket.on("error", (error) => {
      behavior.onError?.(socket, error);
    });
  });

  const getSockets = async (count: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let resolver = (_x: MockServerSocket[]) => {
      /* do nothing */
    };
    const promise = new Promise<MockServerSocket[]>((resolve) => {
      resolver = resolve;
    });

    setInterval(() => {
      if (sockets.length >= count) {
        return resolver(sockets);
      }
    }, 10);

    return withTimeout(
      promise,
      `Mock relay was waiting for ${count} connections to be established, but timed out.`
    );
  };
  const getSocket = async (index: number) => {
    const sockets = await getSockets(index + 1);
    return sockets[index];
  };

  return Object.assign(server, {
    getSockets,
    getSocket,
  });
}

function relayBehavior(): MockServerBehavior &
  Pick<MockRelay, "emit" | "emitCOUNT" | "emitEOSE" | "emitEVENT" | "emitOK"> {
  const reqs: Map<MockServerSocket, Set<string /* subId */>> = new Map();
  const counts: Map<MockServerSocket, Set<string /* subId */>> = new Map();
  const events: Map<MockServerSocket, Set<string /* eventId */>> = new Map();
  const sockets: Set<MockServerSocket> = new Set();

  return {
    onOpen(socket) {
      sockets.add(socket);
    },
    onMessage(socket, rawMessage) {
      const message: Nostr.ToRelayMessage.Any = JSON.parse(rawMessage);
      switch (message[0]) {
        case "CLOSE": {
          const subId = message[1];
          reqs.get(socket)?.delete(subId);
          break;
        }
        case "COUNT": {
          if (!counts.has(socket)) {
            counts.set(socket, new Set());
          }
          const subId = message[1];
          counts.get(socket)?.add(subId);
          break;
        }
        case "EVENT": {
          if (!events.has(socket)) {
            events.set(socket, new Set());
          }
          const eventId = message[1].id;
          events.get(socket)?.add(eventId);
          break;
        }
        case "REQ": {
          if (!reqs.has(socket)) {
            reqs.set(socket, new Set());
          }
          const subId = message[1];
          reqs.get(socket)?.add(subId);
          break;
        }
      }
    },
    onClose(socket) {
      reqs.delete(socket);
      counts.delete(socket);
      events.delete(socket);
      sockets.delete(socket);
    },
    emit(message, socket) {
      const toBeSent =
        typeof message === "string" ? message : `${JSON.stringify(message)}`;

      if (socket) {
        socket.send(toBeSent);
      } else {
        for (const socket of sockets) {
          socket.send(toBeSent);
        }
      }

      return toBeSent;
    },
    emitCOUNT(subId, count) {
      const toBeSent = faker.toClientMessage.COUNT(subId, count);

      for (const [socket, subIds] of counts.entries()) {
        if (subIds.has(subId)) {
          socket.send(toBeSent);
        }
        subIds.delete(subId);
      }

      return toBeSent;
    },
    emitEOSE(subId) {
      const toBeSent = faker.toClientMessage.EOSE(subId);

      for (const [socket, subIds] of reqs.entries()) {
        if (subIds.has(subId)) {
          socket.send(toBeSent);
        }
      }

      return toBeSent;
    },
    emitEVENT(subId, event) {
      const toBeSent = faker.toClientMessage.EVENT(subId, event);

      for (const [socket, subIds] of reqs.entries()) {
        if (subIds.has(subId)) {
          socket.send(toBeSent);
        }
      }

      return toBeSent;
    },
    emitOK(eventId, succeeded, message) {
      const toBeSent = faker.toClientMessage.OK(eventId, succeeded, message);

      for (const [socket, eventIds] of events.entries()) {
        if (eventIds.has(eventId)) {
          socket.send(toBeSent);
        }
        eventIds.delete(eventId);
      }

      return toBeSent;
    },
  };
}

export interface MockRelay extends MockServer {
  /**
   * Pop the latest message that has not yet been consumed.
   * If such a message does not yet exist, it waits for the message
   * until it times out.
   *
   * The default timeout is 1000 miliseconds.
   */
  next: (timeout?: number) => Promise<Nostr.ToRelayMessage.Any>;

  /**
   * Pop the latest `count` messages that have not yet been consumed.
   * If such a message does not yet exist, it waits for the message
   * until it times out.
   *
   * The default timeout is 1000 miliseconds.
   */
  nexts: (
    count: number,
    timeout?: number
  ) => Promise<Nostr.ToRelayMessage.Any[]>;

  /**
   * Send messages of any format from the given socket mock.
   * If `socket` is omitted, it will be sent from all active socket mocks.
   *
   * If the message is a string, as-is string will be sent,
   * otherwise JSON strigify will be attempted.
   *
   * Note that the messages sent by this method are outside
   * the management of the mock relay.
   * This means that if, for example, you use this method to send an OK message,
   * the mock relay will not know about it.
   * Therefore, subsequent calls to emitOK() may send a duplicate OK message.
   * */
  emit(message: unknown, socket?: MockServerSocket): string;

  /* TODO: emitAUTH(): void; */

  /**
   * Send COUNT messages from all socket mocks
   * holding active COUNT subscriptions (in other words,
   * subscriptions that have not yet responded with COUNT)
   * with the given subId.
   */
  emitCOUNT(subId: string, count?: number): Nostr.ToClientMessage.COUNT;

  /**
   * Send EOSE messages from all socket mocks
   * holding active REQ subscriptions (in other words,
   * subscriptions that have not yet been CLOSE'd)
   * with the given subId.
   */
  emitEOSE(subId: string): Nostr.ToClientMessage.EOSE;

  /**
   * Send EVENT messages from all socket mocks
   * holding active REQ subscriptions (in other words,
   * subscriptions that have not yet been CLOSE'd)
   * with the given subId.
   */
  emitEVENT(
    subId: string,
    event?: Partial<Nostr.Event>
  ): Nostr.ToClientMessage.EVENT;

  /**
   * Send OK messages from all socket mocks
   * holding active EVENT (in other words, an EVENT
   * that has not yet returned an OK message)
   * with the given eventId.
   */
  emitOK(
    eventId: string,
    succeeded: boolean,
    message?: string
  ): Nostr.ToClientMessage.OK;
}

export function createMockRelay(url: string): MockRelay {
  const behavior = relayBehavior();
  const server = createMockServer(url, behavior);

  const { emit, emitCOUNT, emitEOSE, emitEVENT, emitOK } = behavior;
  const timeoutMessage =
    "Mock relay was waiting for the next message from the client, but timed out.";

  return Object.assign(server, {
    next: (timeout?: number) =>
      withTimeout(
        server.nextMessage as Promise<Nostr.ToRelayMessage.Any>,
        timeoutMessage,
        timeout
      ),
    nexts: (count: number, timeout?: number) =>
      withTimeout(
        async () => {
          const messages: Nostr.ToRelayMessage.Any[] = [];
          for (let i = 0; i < count; i++) {
            messages.push(
              (await server.nextMessage) as Nostr.ToRelayMessage.Any
            );
          }
          return messages;
        },
        timeoutMessage,
        timeout
      ),
    emit,
    emitCOUNT,
    emitEOSE,
    emitEVENT,
    emitOK,
  });
}
