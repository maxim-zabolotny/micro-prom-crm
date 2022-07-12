import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@schemas/user';

export const Roles = (...roles: Array<UserRole>) => SetMetadata('roles', roles);
