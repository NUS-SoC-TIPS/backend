import { Settings, User } from '../../../../infra/prisma/generated';

export interface UserWithSettings extends User {
  settings: Settings | null;
  isStudent: boolean;
}
