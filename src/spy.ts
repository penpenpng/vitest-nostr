import Nostr from "nostr-typedef";

import { OutOfLifeAccess } from "./error";

export interface ClientSpy {
  __createClientSpy: true;
  next: () => Promise<Nostr.ToClientMessage.Any>;
  dispose: () => void;
}

export function createClientSpy(
  addOnMessageListener: (
    listener: (message: Nostr.ToClientMessage.Any) => void
  ) => void
): ClientSpy {
  type MessageResolver = [
    (message: Nostr.ToClientMessage.Any) => void,
    (error: unknown) => void
  ];
  let queue:
    | { type: "empty" }
    | { type: "message"; items: Nostr.ToClientMessage.Any[] }
    | { type: "resolver"; items: MessageResolver[] } = { type: "empty" };

  addOnMessageListener((message: Nostr.ToClientMessage.Any) => {
    switch (queue.type) {
      case "empty": {
        queue = {
          type: "message",
          items: [message],
        };
        break;
      }
      case "message": {
        queue.items.push(message);

        break;
      }
      case "resolver": {
        const item = queue.items.shift();
        if (item) {
          const resolve = item[0];
          resolve(message);
        }
        if (queue.items.length <= 0) {
          queue = { type: "empty" };
        }
      }
    }
  });

  return {
    __createClientSpy: true,
    next: () =>
      new Promise<Nostr.ToClientMessage.Any>((resolve, reject) => {
        switch (queue.type) {
          case "empty": {
            queue = {
              type: "resolver",
              items: [[resolve, reject]],
            };
            break;
          }
          case "message": {
            const msg = queue.items.shift();
            if (msg) {
              resolve(msg);
            }
            if (queue.items.length <= 0) {
              queue = { type: "empty" };
            }
            break;
          }
          case "resolver": {
            queue.items.push([resolve, reject]);
            break;
          }
        }
      }),
    dispose: () => {
      if (queue.type === "resolver") {
        for (const item of queue.items) {
          const reject = item[1];
          reject(new OutOfLifeAccess());
        }
      }
      queue = { type: "empty" };
    },
  };
}
