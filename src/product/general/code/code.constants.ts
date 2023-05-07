export const CODE_EVENTS = {
  // YJS synchronisation
  CONNECT_YJS: 'connect_yjs',
  UPDATE_YJS: 'update_yjs',

  // To notify of a change in language used for the room
  UPDATE_LANGUAGE: 'update_language',

  // To handle code execution
  EXECUTE_CODE: 'execute_code',
  FAILED_TO_START_EXECUTION: 'failed_to_start_execution',
  EXECUTION_TIMED_OUT: 'execution_timed_out',
  EXECUTION_COMPLETED: 'execution_completed',
};

export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;
export const MESSAGE_AUTH = 2;
export const MESSAGE_QUERY_AWARENESS = 3;

export const CODE_EXECUTION_AUTO_CANCEL_DURATION = 15000; // 15s in milliseconds
