import { makeUserBase, UserBase } from './users';

// This is the minimal information needed by the frontend to
// render the user card element with clickable link.
export interface StudentBase extends UserBase {
  coursemologyName: string; // Not really needed for the card but this is often paired with the profile link
  coursemologyProfileUrl: string;
}

export interface StudentBaseWithId extends StudentBase {
  studentId: number;
}

export const makeStudentBase = (student: {
  user: {
    name: string;
    githubUsername: string;
    profileUrl: string;
    photoUrl: string;
  };
  coursemologyName: string;
  coursemologyProfileUrl: string;
}): StudentBase => {
  return {
    ...makeUserBase(student.user),
    coursemologyName: student.coursemologyName,
    coursemologyProfileUrl: student.coursemologyProfileUrl,
  };
};

export const makeStudentBaseWithId = (student: {
  user: {
    name: string;
    githubUsername: string;
    profileUrl: string;
    photoUrl: string;
  };
  id: number;
  coursemologyName: string;
  coursemologyProfileUrl: string;
}): StudentBaseWithId => {
  return {
    ...makeStudentBase(student),
    studentId: student.id,
  };
};
