import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import Automerge from 'automerge';

import { TextDoc } from '../interfaces/automerge';
import {
  base64StringToBinaryChange,
  binaryChangeToBase64String,
  initDocWithText,
} from '../utils/automerge.util';

@Injectable()
export class CodeService {
  private roomIdToCode: Map<
    number,
    { doc: Automerge.Doc<TextDoc>; language: Language }
  >;

  constructor() {
    this.roomIdToCode = new Map();
  }

  /**
   * Returns the code (in Automerge changes) for a given room.
   *
   * Assumption: If this method is called, then the room should be open and "fetchable".
   * It will not handle cases such as when the room is already in the midst of closing.
   */
  findCode(roomId: number): { code: string[]; language: Language } {
    if (!this.roomIdToCode.has(roomId)) {
      this.roomIdToCode.set(roomId, {
        doc: initDocWithText(''),
        language: Language.PYTHON_THREE,
      });
    }
    const { doc, language } = this.roomIdToCode.get(roomId);
    const code = binaryChangeToBase64String(Automerge.getAllChanges(doc));
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
