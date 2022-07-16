import { User } from '@schemas/user';

export type TTelegramUser = Omit<User, 'role'>;
