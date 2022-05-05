import { Injectable } from '@nestjs/common';
import { Language, Room } from '@prisma/client';
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
  findCode(room: Room): { code: string[]; language: Language } {
    if (!this.roomIdToDoc.has(room.id)) {
      this.roomIdToDoc.set(room.id, initDocWithText(''));
      this.roomIdToLanguage.set(room.id, Language.PYTHON);
    }
    const code = binaryChangeToBase64String(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Automerge.getAllChanges(this.roomIdToDoc.get(room.id)!),
    );
    const language = this.roomIdToLanguage.get(room.id);
    return { code, language };
  }

  updateCode(room: Room, code: string[]): void {
    const doc = this.roomIdToDoc.get(room.id);
    const [newDoc] = Automerge.applyChanges(
      Automerge.clone(doc),
      base64StringToBinaryChange(code),
    );
    this.roomIdToDoc.set(room.id, newDoc);
  }

  updateLanguage(room: Room, language: Language): void {
    this.roomIdToLanguage.set(room.id, language);
  }
}
