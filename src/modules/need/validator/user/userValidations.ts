import { User } from 'src/modules/auth/entities/auth.enity';
import { ForbiddenException } from '@nestjs/common';
import { EAuthRoles, Status } from 'src/modules/auth/enums/auth';

export function userValidations(user: User) {
  if (!user.roles.includes(EAuthRoles.COORDINATOR)) {
    throw new ForbiddenException('Sem permissão para criar necessidades.');
  }

  if (user.status != Status.APPROVED) {
    throw new ForbiddenException('Sem permissão para criar necessidades.');
  }
}
