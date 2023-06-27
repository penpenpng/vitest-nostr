import Nostr from "nostr-typedef";

import { TimeoutError } from "../error";

type MessageResolver = (message: Nostr.ToClientMessage.Any) => void;

class MockClientImpl implements MockClient {
  private socket: WebSocket;
  private queue:
    | { type: "empty" }
    | { type: "message"; items: Nostr.ToClientMessage.Any[] }
    | { type: "resolver"; items: MessageResolver[] } = { type: "empty" };

  constructor(public url: string) {
    const socket = new WebSocket(this.url);
    socket.addEventListener("message", (ev) => {
      const message: Nostr.ToClientMessage.Any = JSON.parse(ev.data);

      switch (this.queue.type) {
        case "empty": {
          this.queue = {
            type: "message",
            items: [message],
          };
          break;
        }
        case "message": {
          this.queue.items.push(message);

          break;
        }
        case "resolver": {
          const resolver = this.queue.items.shift();
          if (resolver) {
            resolver(message);
          }
          if (this.queue.items.length <= 0) {
            this.queue = { type: "empty" };
          }
        }
      }
    });
    this.socket = socket;
  }

  send(message: Nostr.ToRelayMessage.Any) {
    this.socket.send(JSON.stringify(message));
  }

  async next(timeout = 1000) {
    return new Promise<Nostr.ToClientMessage.Any>((resolve, reject) => {
      const timerId = setTimeout(() => {
        const error = new TimeoutError(
          "Mock client was waiting for the next message from the client, but timed out."
        );
        reject(error);
      }, timeout);
      const resolver: MessageResolver = (message) => {
        resolve(message);
        clearTimeout(timerId);
      };

      switch (this.queue.type) {
        case "empty": {
          this.queue = {
            type: "resolver",
            items: [resolver],
          };
          break;
        }
        case "message": {
          const msg = this.queue.items.shift();
          if (msg) {
            resolver(msg);
          }
          if (this.queue.items.length <= 0) {
            this.queue = { type: "empty" };
          }
          break;
        }
        case "resolver": {
          this.queue.items.push(resolver);
          break;
        }
      }
    });
  }

  dispose() {
    this.socket.close();
  }
}

export interface MockClient {
  send(message: Nostr.ToRelayMessage.Any): void;
  dispose(): void;
  next(timeout?: number): Promise<Nostr.ToClientMessage.Any>;
}

export function createMockClient(url: string): MockClient {
  return new MockClientImpl(url);
}
