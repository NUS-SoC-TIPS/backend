import { Injectable } from '@nestjs/common';
import { Language, Room } from '@prisma/client';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { ISocket } from 'src/interfaces/socket';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

import { UsersService } from '../users/users.service';

import { MESSAGE_AWARENESS, MESSAGE_SYNC } from './code.constants';
import { YjsDoc } from './code.yjs';

@Injectable()
export class CodeService {
  private roomToLanguage: Map<number, Language>;
  private roomToDoc: Map<number, YjsDoc>;

  constructor(private readonly usersService: UsersService) {
    this.roomToLanguage = new Map();
    this.roomToDoc = new Map();
  }

  joinOrInitDoc(
    room: Room,
    socket: ISocket,
  ): { sync: Uint8Array; awareness?: Uint8Array } {
    if (!this.roomToDoc.has(room.id)) {
      this.roomToDoc.set(room.id, new YjsDoc(room.slug));
    }
    const doc = this.roomToDoc.get(room.id);
    doc.connections.set(socket, new Set());

    // Handle sync
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    const sync = encoding.toUint8Array(encoder);

    // Handle awarenesss
    let awareness: Uint8Array | undefined;
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys()),
        ),
      );
      awareness = encoding.toUint8Array(encoder);
    }
    return { sync, awareness };
  }

  updateDoc(
    roomId: number,
    socket: ISocket,
    data: any,
  ): Uint8Array | undefined {
    const doc = this.roomToDoc.get(roomId);
    if (!doc) {
      return;
    }

    try {
      const encoder = encoding.createEncoder();
      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC:
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, doc, null);
          if (encoding.length(encoder) > 1) {
            return encoding.toUint8Array(encoder);
          }
          break;
        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            doc.awareness,
            decoding.readVarUint8Array(decoder),
            socket,
          );
          break;
        }
      }
    } catch (err) {
      doc.emit('error', [err]);
    }
  }

  leaveDoc(roomId: number, socket: ISocket): void {
    const doc = this.roomToDoc.get(roomId);
    if (!doc || !doc.connections.has(socket)) {
      return;
    }
    const controlledIds = doc.connections.get(socket);
    doc.connections.delete(socket);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null,
    );
  }

  /**
   * Returns the language for a given room if it is already initialised, else it's
   * initialised before being returned.
   *
   * Assumption: If this method is called, then the room should be open and "fetchable".
   * It will not handle cases such as when the room is already in the midst of closing.
   */
  async findOrInitLanguage(roomId: number, userId: string): Promise<Language> {
    if (!this.roomToLanguage.has(roomId)) {
      const userSettings = await this.usersService.findSettings(userId);
      this.roomToLanguage.set(
        roomId,
        userSettings?.preferredInterviewLanguage ?? Language.PYTHON_THREE,
      );
    }
    return this.roomToLanguage.get(roomId);
  }

  /**
   * Note: Update will fail silently if the room doesn't exist in its data structures.
   *
   * Assumption: When joining the room, the findCode method is called first, which would
   * have initialised the room. If the room doesn't exist, then it must have been closed.
   */
  updateLanguage(roomId: number, language: Language): void {
    if (!this.roomToLanguage.has(roomId)) {
      return;
    }
    this.roomToLanguage.set(roomId, language);
  }

  /**
   * Closes the room and returns stringified data for persistence purposes.
   */
  closeRoom(room: Room): { code: string; language: Language } {
    const language = this.roomToLanguage.get(room.id) ?? Language.PYTHON_THREE;
    this.roomToLanguage.delete(room.id);
    const doc = this.roomToDoc.get(room.id);
    this.roomToDoc.delete(room.id);
    if (!doc) {
      return { code: '', language };
    }
    const code = doc.getText(room.slug).toJSON().trim();
    doc.destroy();
    return { code, language };
  }
}
