import { UserRole } from '@schemas/user';

export interface IUserSeed {
  telegramId: number;
  chatId: number;
  name: string;
  hasBotAccess: boolean;
  username: string | undefined;
  role: UserRole;
}
