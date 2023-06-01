import {
  KeyBinding,
  Language,
  UserRole,
} from '../../../infra/prisma/generated';
import { makeUserBase, UserBase } from '../../interfaces';

interface ExclusionNotification {
  createdAt: Date;
  cohortId: number; // For frontend to jump to the right cohort
  cohortName: string;
}

// Will be a union type in the future.
type Notification = ExclusionNotification;

export interface UserSelf extends UserBase {
  id: string;
  role: UserRole;
  isStudent: boolean;
  preferredInterviewLanguage: Language | null;
  preferredKeyBinding: KeyBinding;
  notifications: Notification[];
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
    notifications: {
      exclusionNotification: {
        exclusion: { window: { cohort: { id: number; name: string } } };
      } | null;
      createdAt: Date;
    }[];
  },
  isStudent: boolean,
): UserSelf => {
  const notifications: Notification[] = [];
  user.notifications.forEach((notification) => {
    if (notification.exclusionNotification != null) {
      const {
        exclusion: {
          window: { cohort },
        },
      } = notification.exclusionNotification;
      notifications.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        createdAt: notification.createdAt,
      });
    }
  });
  return {
    ...makeUserBase(user),
    id: user.id,
    role: user.role,
    isStudent,
    preferredInterviewLanguage:
      user.settings?.preferredInterviewLanguage ?? null,
    preferredKeyBinding:
      user.settings?.preferredKeyBinding ?? KeyBinding.STANDARD,
    notifications,
  };
};
