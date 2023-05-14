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

  // For any of the two users in the room to end the session. Also sent back to both users in room upon room close success.
  CLOSE_ROOM: 'close_room',
  CLOSING_ROOM: 'closing_room', // To trigger loading state

  // To inform the other user that one user has disconnected
  PARTNER_DISCONNECTED: 'partner_disconnected',

  // General errors, such as due to database errors
  JOIN_ROOM_FAILED: 'join_room_failed',
  CLOSE_ROOM_FAILED: 'close_room_failed',
};

export const ROOM_AUTOCLOSE_DURATION = 300000; // 5 minutes in milliseconds
export const MINIMUM_VALID_INTERVIEW_DURATION = 900000; // 15 minutes in milliseconds
