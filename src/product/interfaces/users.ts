import { KeyBinding, Language, UserRole } from '../../infra/prisma/generated';

// This is the minimal information needed by the frontend to
// render the user card element.
export interface UserBase {
  name: string;
  githubUsername: string;
  profileUrl: string;
  photoUrl: string;
}

export interface UserSelf extends UserBase {
  id: string;
  role: UserRole;
  isStudent: boolean;
  preferredInterviewLanguage: Language | null;
  preferredKeyBinding: KeyBinding;
}

export const makeUserBase = (user: {
  name: string;
  githubUsername: string;
  profileUrl: string;
  photoUrl: string;
}): UserBase => {
  return {
    name: user.name,
    githubUsername: user.githubUsername,
    profileUrl: user.profileUrl,
    photoUrl: user.photoUrl,
  };
};

export const makeUserSelf = (
  user: {
    id: string;
    name: string;
    githubUsername: string;
    profileUrl: string;
    photoUrl: string;
    role: UserRole;
    settings: {
      preferredInterviewLanguage: Language | null;
      preferredKeyBinding: KeyBinding;
    } | null;
  },
  isStudent: boolean,
): UserSelf => {
  return {
    ...makeUserBase(user),
    id: user.id,
    role: user.role,
    isStudent,
    preferredInterviewLanguage:
      user.settings?.preferredInterviewLanguage ?? null,
    preferredKeyBinding:
      user.settings?.preferredKeyBinding ?? KeyBinding.STANDARD,
  };
};
