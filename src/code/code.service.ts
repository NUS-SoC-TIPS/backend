import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';
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
  constructor() {
    this.roomIdToDoc = new Map();
  }

  /**
   * Returns the code (in Automerge changes) for a given room.
   */
  findCode(room: Room): string[] {
    if (!this.roomIdToDoc.has(room.id)) {
      this.roomIdToDoc.set(room.id, initDocWithText(''));
    }
    const allChanges = binaryChangeToBase64String(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Automerge.getAllChanges(this.roomIdToDoc.get(room.id)!),
    );
    return allChanges;
  }

  updateCode(room: Room, code: string[]): void {
    const doc = this.roomIdToDoc.get(room.id);
    const [newDoc] = Automerge.applyChanges(
      Automerge.clone(doc),
      base64StringToBinaryChange(code),
    );
    this.roomIdToDoc.set(room.id, newDoc);
  }
}
