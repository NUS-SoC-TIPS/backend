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
  private roomIdToDoc: Map<number, Automerge.Doc<TextDoc>>;
  private roomIdToLanguage: Map<number, Language>;
  constructor() {
    this.roomIdToDoc = new Map();
    this.roomIdToLanguage = new Map();
  }

  /**
   * Returns the code (in Automerge changes) for a given room.
   */
  findCode(roomId: number): { code: string[]; language: Language } {
    if (!this.roomIdToDoc.has(roomId)) {
      this.roomIdToDoc.set(roomId, initDocWithText(''));
      this.roomIdToLanguage.set(roomId, Language.PYTHON);
    }
    const code = binaryChangeToBase64String(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Automerge.getAllChanges(this.roomIdToDoc.get(roomId)!),
    );
    const language = this.roomIdToLanguage.get(roomId);
    return { code, language };
  }

  updateCode(roomId: number, code: string[]): void {
    const doc = this.roomIdToDoc.get(roomId);
    const [newDoc] = Automerge.applyChanges(
      Automerge.clone(doc),
      base64StringToBinaryChange(code),
    );
    this.roomIdToDoc.set(roomId, newDoc);
  }

  updateLanguage(roomId: number, language: Language): void {
    this.roomIdToLanguage.set(roomId, language);
  }

  /**
   * Closes the room and returns stringified data for persistence purposes.
   */
  closeRoom(roomId: number): { code: string; language: Language } {
    if (!this.roomIdToDoc.has(roomId)) {
      return { code: '', language: Language.PYTHON };
    }
    const code = this.roomIdToDoc.get(roomId).text.toString();
    const language = this.roomIdToLanguage.get(roomId);
    this.roomIdToDoc.delete(roomId);
    this.roomIdToLanguage.delete(roomId);
    return { code, language };
  }
}
