import * as encoding from 'lib0/encoding';
import { ISocket } from 'src/interfaces/socket';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as Y from 'yjs';

import { CODE_EVENTS, MESSAGE_AWARENESS, MESSAGE_SYNC } from './code.constants';

export class YjsDoc extends Y.Doc {
  public awareness: awarenessProtocol.Awareness;
  // Maps from socket to a set of controlled user IDs. Delete all user IDs from awareness when this socket is disconnected.
  public connections = new Map<ISocket, Set<number>>();

  constructor(public name: string) {
    super({ gc: true });
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    // Set handlers
    const handleAwarenessUpdate = (
      {
        added,
        updated,
        removed,
      }: { added: number[]; updated: number[]; removed: number[] },
      socket: ISocket | null,
    ): void => {
      const changedClients = added.concat(updated, removed);
      if (socket !== null) {
        const connControlledIDs = this.connections.get(socket);
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
      const message = encoding.toUint8Array(encoder);
      this.connections.forEach((_, socket) =>
        socket.emit(CODE_EVENTS.UPDATE_YJS, message),
      );
    };
    this.awareness.on('update', handleAwarenessUpdate);

    const handleDocUpdate = (update: Uint8Array): void => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      this.connections.forEach((_, socket) =>
        socket.emit(CODE_EVENTS.CONNECT_YJS, message),
      );
    };
    this.on('update', handleDocUpdate);
  }
}
