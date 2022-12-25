import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language, Room } from '@prisma/client';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

import { ISocket } from '../interfaces/socket';
import { UsersService } from '../users/users.service';

import { MESSAGE_AWARENESS, MESSAGE_SYNC } from './code.constants';
import { YjsDoc } from './code.yjs';

@Injectable()
export class CodeService {
  private roomToLanguage: Map<number, Language>;
  private roomToDoc: Map<number, YjsDoc>;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.roomToLanguage = new Map();
    this.roomToDoc = new Map();
  }

  joinOrInitDoc(
    room: Room,
    socket: ISocket,
  ): { sync: Uint8Array; awareness?: Uint8Array } {
    let doc = this.roomToDoc.get(room.id);
    if (doc == null) {
      doc = new YjsDoc(room.slug);
      this.roomToDoc.set(room.id, doc);
    }
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
    if (doc == null) {
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
    const controlledIds = doc?.connections?.get(socket);
    if (doc == null || controlledIds == null) {
      return;
    }
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
    let language = this.roomToLanguage.get(roomId);
    if (language == null) {
      const userSettings = await this.usersService.findSettings(userId);
      language =
        userSettings?.preferredInterviewLanguage ?? Language.PYTHON_THREE;
      this.roomToLanguage.set(roomId, language);
    }
    return language;
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
    if (doc == null) {
      return { code: '', language };
    }
    const code = doc.getText(room.slug).toJSON().trim();
    doc.destroy();
    return { code, language };
  }

  executeCode(room: Room): boolean {
    const doc = this.roomToDoc.get(room.id);
    if (doc == null) {
      return false;
    }
    const _code = doc.getText(room.slug).toJSON().trim();
    // TODO: Post code over to Judge0 endpoint
    // TODO: Think about how to handle the token
    return true;
  }
}
