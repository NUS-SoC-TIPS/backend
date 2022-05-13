export const ROOM_EVENTS = {
  // For both users to join. Also sent back to the joining user.
  JOIN_ROOM: 'join_room',

  // To notify the other user that a new user joined
  JOINED_ROOM: 'joined_room',

  // Various exceptions
  ROOM_DOES_NOT_EXIST: 'room_does_not_exist',
  ALREADY_IN_ROOM: 'already_in_room',
  IN_ANOTHER_TAB: 'in_another_tab', // when user is in the room but in another tab
  ROOM_IS_FULL: 'room_is_full',
  ROOM_IS_CLOSED: 'room_is_closed',

  // For any of the two users in the room to end the session. Also sent back to both users in room.
  CLOSE_ROOM: 'close_room',
  CLOSING_ROOM: 'closing_room', // Sent to block any further changes from users

  // To inform the other user that one user has disconnected
  PARTNER_DISCONNECTED: 'partner_disconnected',
};
