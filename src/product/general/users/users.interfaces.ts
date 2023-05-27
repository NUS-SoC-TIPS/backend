import {
  KeyBinding,
  Language,
  UserRole,
} from '../../../infra/prisma/generated';
import { makeUserBase, UserBase } from '../../interfaces';

export interface UserSelf extends UserBase {
  id: string;
  role: UserRole;
  isStudent: boolean;
  preferredInterviewLanguage: Language | null;
  preferredKeyBinding: KeyBinding;
}

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
