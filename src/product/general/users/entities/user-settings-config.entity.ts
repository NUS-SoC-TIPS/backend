import { ConfigData } from '../../../../infra/data/entities';
import { Settings, User } from '../../../../infra/prisma/generated';

export type AppConfig = ConfigData;

export interface UserWithSettings extends User {
  settings: Settings | null;
  isStudent: boolean;
}
