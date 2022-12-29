import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotesService {
  private roomIdToUserIdToNotesMap: Map<number, Map<string, string>>;

  constructor(private readonly logger: Logger) {
    this.roomIdToUserIdToNotesMap = new Map();
  }

  /**
   * Note: Update will fail silently if the room doesn't exist.
   *
   * Assumption: When joining the room, the findForUserInRoom method is called first, which would
   * have initialised the room and user. If the room doesn't exist, then the room must have been closed.
   */
  updateNotes(roomId: number, userId: string, notes: string): void {
    const notesMap = this.roomIdToUserIdToNotesMap.get(roomId);
    if (notesMap == null) {
      this.logger.warn('Failed to find notes for updating', NotesService.name);
      return;
    }
    notesMap.set(userId, notes);
  }

  findForUserInRoom(roomId: number, userId: string): string {
    let notesMap = this.roomIdToUserIdToNotesMap.get(roomId);
    if (notesMap == null) {
      notesMap = new Map();
      this.roomIdToUserIdToNotesMap.set(roomId, notesMap);
    }
    let notes = notesMap.get(userId);
    if (!notes) {
      notes = '';
      notesMap.set(userId, notes);
    }
    return notes;
  }

  /**
   * Returns the notes taken by the users in the room.
   */
  getNotes(roomId: number): { userId: string; notes: string }[] {
    const userIdToNotesMap = this.roomIdToUserIdToNotesMap.get(roomId);
    if (userIdToNotesMap == null) {
      this.logger.warn(
        'Failed to find notes for room, returning default values',
        NotesService.name,
      );
      return [];
    }
    const result: { userId: string; notes: string }[] = [];
    for (const [userId, notes] of userIdToNotesMap.entries()) {
      result.push({ userId, notes: notes.trim() });
    }
    return result;
  }

  /**
   * Cleans up the notes for the room.
   */
  closeRoom(roomId: number): void {
    this.roomIdToUserIdToNotesMap.delete(roomId);
  }
}
