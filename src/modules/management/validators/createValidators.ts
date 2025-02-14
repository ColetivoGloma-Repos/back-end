import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/modules/auth/entities/auth.enity';
import { EAuthRoles, Status } from 'src/modules/auth/enums/auth';

export function createValidator(coordinator: User) {
  if (!coordinator.roles.includes(EAuthRoles.COORDINATOR)) {
    throw new ForbiddenException(
      'Usuário sem permissão para realizar agendamento.',
    );
  }
  if (coordinator.status != Status.APPROVED) {
    throw new ForbiddenException(
      'Usuário sem permissão para realizar agendamento.',
    );
  }
}
