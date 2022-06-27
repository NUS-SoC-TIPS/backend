import * as encoding from 'lib0/encoding';
import * as mutex from 'lib0/mutex';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Socket } from 'socket.io';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as Y from 'yjs';



export class SharedDoc extends Y.Doc {
  awareness: awarenessProtocol.Awareness;
  mux = mutex.createMutex();
  sockets = new Map<Socket, Set<number>>();

  constructor(public name: string) {
    super({ gc: true });
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = (
      {
        added,
        updated,
        removed,
      }: { added: number[]; updated: number[]; removed: number[] },
      socket: Socket | null,
    ): void => {
      const changedClients = added.concat(updated, removed);
      if (socket !== null) {
        const connControlledIDs = this.sockets.get(socket);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => {
            connControlledIDs.add(clientID);
          });
          removed.forEach((clientID) => {
            connControlledIDs.delete(clientID);
          });
        }
      }
      // Broadcast awareness update
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
      );
      const buff = encoding.toUint8Array(encoder);
      this.sockets.forEach((_, c) => {
        send(this, c, buff);
      });
    };

    this.awareness.on('update', awarenessChangeHandler);
    this.on('update', updateHandler);
  }
}

const updateHandler = (
  update: Uint8Array,
  _origin: Socket,
  doc: SharedDoc,
): void => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.sockets.forEach((_, socket) => send(doc, socket, message));
};

const send = (doc: SharedDoc, socket: Socket, m: Uint8Array): void => {
  try {
    socket.emit('some_event', m);
  } catch (e) {
    closeConn(doc, socket);
  }
};

const closeConn = (doc: SharedDoc, socket: Socket): void => {
  if (doc.sockets.has(socket)) {
    const controlledIds = doc.sockets.get(socket);
    doc.sockets.delete(socket);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null,
    );
  }
  socket.disconnect();
};
