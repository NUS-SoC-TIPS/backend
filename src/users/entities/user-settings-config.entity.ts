import { Settings, User } from '@prisma/client';

export interface AppConfig {
  coursemology: string;
}

export interface UserSettingsConfig extends User {
  settings: Settings | null;
  config: AppConfig;
}
