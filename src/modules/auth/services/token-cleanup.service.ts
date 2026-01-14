import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    try {
      const result = await this.passwordResetTokenRepo.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`${result.affected} token(s) expirado(s) removido(s) do banco de dados`);
      }
    } catch (error) {
      this.logger.error('Erro ao limpar tokens expirados:', error);
    }
  }
}
