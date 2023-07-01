import Nostr from "nostr-typedef";

import { createClientSpy } from "..";

export interface MockClient {
  send(message: Nostr.ToRelayMessage.Any): void;
  dispose(): void;
  next(): Promise<Nostr.ToClientMessage.Any>;
}

export function createMockClient(url: string): MockClient {
  const socket = new WebSocket(url);

  return {
    ...createClientSpy((listener) => {
      socket.addEventListener("message", ({ data }) =>
        listener(JSON.parse(data))
      );
    }),
    dispose: () => {
      socket.close();
    },
    send: (message) => {
      socket.send(JSON.stringify(message));
    },
  };
}
