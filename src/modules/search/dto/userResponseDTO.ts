import { User } from 'src/modules/auth/entities/auth.enity';

export class UserResponseDTO {
  name: string;
  email: string;

  constructor(user: User) {
    (this.name = user.name), (this.email = user.email);
  }
}
