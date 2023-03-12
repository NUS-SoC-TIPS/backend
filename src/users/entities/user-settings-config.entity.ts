import { ConfigData } from '../../data/entities';
import { Settings, User } from '../../prisma/generated';

export type AppConfig = ConfigData;

export interface UserSettingsConfig extends User {
  settings: Settings | null;
  config: AppConfig;
}
