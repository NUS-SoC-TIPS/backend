import { Injectable } from '@nestjs/common';

@Injectable()
export class NotesService {
  private roomIdToUserIdToNotesMap: Map<number, Map<string, string>>;

  constructor() {
    this.roomIdToUserIdToNotesMap = new Map();
  }

  /**
   * Note: Update will fail silently if the room doesn't exist.
   *
   * Assumption: When joining the room, the findForUserInRoom method is called first, which would
   * have initialised the room and user. If the room doesn't exist, then the room must have been closed.
   */
  updateNotes(roomId: number, userId: string, notes: string): void {
    if (!this.roomIdToUserIdToNotesMap.has(roomId)) {
      return;
    }
    this.roomIdToUserIdToNotesMap.get(roomId).set(userId, notes);
  }

  findForUserInRoom(roomId: number, userId: string): string {
    if (!this.roomIdToUserIdToNotesMap.has(roomId)) {
      this.roomIdToUserIdToNotesMap.set(roomId, new Map());
    }
    if (!this.roomIdToUserIdToNotesMap.get(roomId).has(userId)) {
      this.roomIdToUserIdToNotesMap.get(roomId).set(userId, '');
    }
    return this.roomIdToUserIdToNotesMap.get(roomId).get(userId);
  }

  /**
   * Closes the room and returns the notes taken by the users in the room.
   */
  closeRoom(roomId: number): { userId: string; notes: string }[] {
    if (!this.roomIdToUserIdToNotesMap.has(roomId)) {
      return [];
    }
    const userIdToNotesMap = this.roomIdToUserIdToNotesMap.get(roomId);
    const result = [];
    for (const [userId, notes] of userIdToNotesMap.entries()) {
      result.push({ userId, notes: notes.trim() });
    }
    this.roomIdToUserIdToNotesMap.delete(roomId);
    return result;
  }
}
