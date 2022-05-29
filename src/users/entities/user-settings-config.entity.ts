import { Settings, User } from '@prisma/client';

import { ConfigData } from '../../data/entities';

export type AppConfig = ConfigData;

export interface UserSettingsConfig extends User {
  settings: Settings | null;
  config: AppConfig;
}
