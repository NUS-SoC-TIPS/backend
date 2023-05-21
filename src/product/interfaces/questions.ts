import {
  Language,
  QuestionDifficulty,
  QuestionSource,
} from '../../infra/prisma/generated';

// This is the minimal information needed by the frontend to
// render the question card element.
export interface QuestionBase {
  name: string;
  source: QuestionSource;
  difficulty: QuestionDifficulty;
  slug: string;
}

// This is the minimal information needed by the frontend to
// render the submission card element (with a clickable link)
export interface SubmissionBase {
  id: number;
  question: QuestionBase;
}

// Information needed by the frontend to render the table/list
// of submissions for a user
export interface SubmissionListItem extends SubmissionBase {
  submittedAt: Date;
  language: Language;
}

export interface SubmissionItem extends SubmissionListItem {
  codeWritten: string;
}

export const makeQuestionBase = (question: {
  name: string;
  source: QuestionSource;
  difficulty: QuestionDifficulty;
  slug: string;
}): QuestionBase => {
  return {
    name: question.name,
    source: question.source,
    difficulty: question.difficulty,
    slug: question.slug,
  };
};

export const makeSubmissionBase = (submission: {
  id: number;
  question: {
    name: string;
    source: QuestionSource;
    difficulty: QuestionDifficulty;
    slug: string;
  };
}): SubmissionBase => {
  return {
    id: submission.id,
    question: makeQuestionBase(submission.question),
  };
};

export const makeSubmissionListItem = (submission: {
  id: number;
  createdAt: Date;
  language: Language;
  question: {
    name: string;
    source: QuestionSource;
    difficulty: QuestionDifficulty;
    slug: string;
  };
}): SubmissionListItem => {
  return {
    ...makeSubmissionBase(submission),
    submittedAt: submission.createdAt,
    language: submission.language,
  };
};

export const makeSubmissionItem = (submission: {
  id: number;
  createdAt: Date;
  languageUsed: Language;
  codeWritten: string;
  question: {
    name: string;
    source: QuestionSource;
    difficulty: QuestionDifficulty;
    slug: string;
  };
}): SubmissionItem => {
  return {
    ...makeSubmissionItem(submission),
    codeWritten: submission.codeWritten,
  };
};
