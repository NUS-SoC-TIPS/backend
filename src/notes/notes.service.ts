import { Injectable } from '@nestjs/common';

@Injectable()
export class NotesService {
  private roomIdToUserIdToNotesMap: Map<number, Map<string, string>>;
  constructor() {
    this.roomIdToUserIdToNotesMap = new Map();
  }

  updateNotes(roomId: number, userId: string, notes: string): void {
    if (!this.roomIdToUserIdToNotesMap.has(roomId)) {
      this.roomIdToUserIdToNotesMap.set(roomId, new Map());
    }
    this.roomIdToUserIdToNotesMap.get(roomId).set(userId, notes);
  }
}
