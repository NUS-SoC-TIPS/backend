import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import Automerge from 'automerge';
import { encoding } from 'lib0';
import * as syncProtocol from 'y-protocols/sync';

import { base64StringToBinaryChange } from '../utils/automerge.util';

import { MESSAGE_SYNC } from './code.constants';
import { SharedDoc } from './code.yjs';

@Injectable()
export class CodeService {
  private roomIdToCode: Map<number, { doc: SharedDoc; language: Language }>;

  constructor() {
    this.roomIdToCode = new Map();
  }

  /**
   * Returns the code (in Automerge changes) for a given room.
   *
   * Assumption: If this method is called, then the room should be open and "fetchable".
   * It will not handle cases such as when the room is already in the midst of closing.
   */
  findCode(roomId: number): { code: Uint8Array; language: Language } {
    if (!this.roomIdToCode.has(roomId)) {
      this.roomIdToCode.set(roomId, {
        doc: new SharedDoc(`${roomId}`),
        language: Language.PYTHON_THREE,
      });
    }
    const { doc, language } = this.roomIdToCode.get(roomId);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    return { code, language };
  }

  /**
   * Note: Update will fail silently if the room doesn't exist in its data structures.
   *
   * Assumption: When joining the room, the findCode method is called first, which would
   * have initialised the room. If the room doesn't exist, then it must have been closed.
   */
  updateCode(roomId: number, code: string[]): void {
    if (!this.roomIdToCode.has(roomId)) {
      return;
    }
    const data = this.roomIdToCode.get(roomId);
    const [newDoc] = Automerge.applyChanges(
      Automerge.clone(data.doc),
      base64StringToBinaryChange(code),
    );
    this.roomIdToCode.set(roomId, { ...data, doc: newDoc });
  }

  /**
   * Note: Update will fail silently if the room doesn't exist in its data structures.
   *
   * Assumption: When joining the room, the findCode method is called first, which would
   * have initialised the room. If the room doesn't exist, then it must have been closed.
   */
  updateLanguage(roomId: number, language: Language): void {
    if (!this.roomIdToCode.has(roomId)) {
      return;
    }
    const data = this.roomIdToCode.get(roomId);
    this.roomIdToCode.set(roomId, { ...data, language });
  }

  /**
   * Closes the room and returns stringified data for persistence purposes.
   */
  closeRoom(roomId: number): { code: string; language: Language } {
    if (!this.roomIdToCode.has(roomId)) {
      return { code: '', language: Language.PYTHON };
    }
    const { doc, language } = this.roomIdToCode.get(roomId);
    const code = doc.text.toString().trim();
    this.roomIdToCode.delete(roomId);
    return { code, language };
  }
}
