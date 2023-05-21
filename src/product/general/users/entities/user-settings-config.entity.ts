import { BaseUser } from '../../../../infra/interfaces/interface';
import {
  KeyBinding,
  Language,
  UserRole,
} from '../../../../infra/prisma/generated';

export interface SelfUser extends BaseUser {
  role: UserRole;
  isStudent: boolean;
  preferredInterviewLanguage: Language | null;
  preferredKeyBinding: KeyBinding;
}
