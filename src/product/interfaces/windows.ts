export interface WindowBase {
  id: number;
  startAt: Date;
  endAt: Date;
  numQuestions: number;
  requireInterview: boolean;
}

export const makeWindowBase = (window: {
  id: number;
  startAt: Date;
  endAt: Date;
  numQuestions: number;
  requireInterview: boolean;
}): WindowBase => {
  return {
    id: window.id,
    startAt: window.startAt,
    endAt: window.endAt,
    numQuestions: window.numQuestions,
    requireInterview: window.requireInterview,
  };
};
