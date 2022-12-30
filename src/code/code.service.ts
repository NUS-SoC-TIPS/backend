import { Injectable, Logger } from '@nestjs/common';
import { Language, Room } from '@prisma/client';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';

import { ISocket } from '../interfaces/socket';
import { CallbackDto } from '../judge0/dtos';
import { ExecutionResultEntity } from '../judge0/entities';
import { Judge0Service } from '../judge0/judge0.service';
import { UsersService } from '../users/users.service';

import { MESSAGE_AWARENESS, MESSAGE_SYNC } from './code.constants';
import { YjsDoc } from './code.yjs';

@Injectable()
export class CodeService {
  private roomToLanguage: Map<number, Language>;
  private roomToDoc: Map<number, YjsDoc>;

  constructor(
    private readonly usersService: UsersService,
    private readonly judge0Service: Judge0Service,
    private readonly logger: Logger,
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

    // Handle awareness
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
      this.logger.warn('Failed to find YJS doc for updating', CodeService.name);
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
        case MESSAGE_AWARENESS:
          awarenessProtocol.applyAwarenessUpdate(
            doc.awareness,
            decoding.readVarUint8Array(decoder),
            socket,
          );
          break;
        default:
          this.logger.error(
            `Unknown YJS message type: ${messageType}`,
            undefined,
            CodeService.name,
          );
      }
    } catch (e) {
      this.logger.error(
        'Failed to update YJS doc',
        e instanceof Error ? e.stack : undefined,
        CodeService.name,
      );
      doc.emit('error', [e]);
    }
  }

  leaveDoc(roomId: number, socket: ISocket): void {
    const doc = this.roomToDoc.get(roomId);
    const controlledIds = doc?.connections?.get(socket);
    if (doc == null || controlledIds == null) {
      this.logger.warn(
        'User attempted to leave YJS doc despite doc not existing or socket not being connected',
        CodeService.name,
      );
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
      language = Language.PYTHON_THREE;
      await this.usersService
        .findSettings(userId)
        .then((userSettings) => {
          language = userSettings?.preferredInterviewLanguage ?? language;
        })
        .catch(() => {
          // We will consume the error here instead of propagating it up further.
          this.logger.warn(
            'Failed to find preferred interview language setting, using default',
            CodeService.name,
          );
        });
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
      this.logger.warn(
        'Failed to find language for updating',
        CodeService.name,
      );
      return;
    }
    this.roomToLanguage.set(roomId, language);
  }

  getCodeAndLanguage(room: Room): { code: string; language: Language } {
    const language = this.roomToLanguage.get(room.id) ?? Language.PYTHON_THREE;
    const doc = this.roomToDoc.get(room.id);
    if (doc == null) {
      this.logger.warn(
        'Failed to find doc for getting code, returning default values',
        CodeService.name,
      );
      return { code: '', language };
    }
    const code = doc.getText(room.slug).toJSON().trim();
    return { code, language };
  }

  /**
   * Cleans up the code and language for the room.
   */
  closeRoom(room: Room): void {
    this.roomToLanguage.delete(room.id);
    const doc = this.roomToDoc.get(room.id);
    this.roomToDoc.delete(room.id);
    if (doc != null) {
      doc.destroy();
    }
  }

  // Sends the code over to Judge0 for execution and returns the submission token
  async executeCodeAsync(room: Room): Promise<string | null> {
    const { code, language } = this.getCodeAndLanguage(room);
    if (code === '') {
      this.logger.warn(
        'Attempted to execute empty code async',
        CodeService.name,
      );
      return null;
    }
    return this.judge0Service.createAsyncSubmission(code, language);
  }

  async executeCodeSync(room: Room): Promise<ExecutionResultEntity | null> {
    const { code, language } = this.getCodeAndLanguage(room);
    if (code === '') {
      this.logger.warn(
        'Attempted to execute empty code sync',
        CodeService.name,
      );
      return null;
    }
    return this.judge0Service.createSyncSubmission(code, language);
  }

  // Methods that wrap around Judge0Service

  interpretResults(dto: CallbackDto): ExecutionResultEntity {
    return this.judge0Service.interpretResults(dto);
  }

  getExecutableLanguages(): Promise<{ [language: string]: string }> {
    return this.judge0Service.getExecutableLanguages();
  }
}
