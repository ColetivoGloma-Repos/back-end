import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './entities/auth.enity';
import { Address } from './entities/adress.enity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { CompanyModule } from '../company/company.module';
import { EnvConfig } from 'src/config';
import { MailModule } from '../mail/mail.module';
import { TokenCleanupService } from './services/token-cleanup.service'; 
import { Shelter } from '../shelter/entities/shelter.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, PasswordResetToken, Shelter]),
    CompanyModule,
    MailModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: EnvConfig.JWT_SECRET.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, TokenCleanupService],
  controllers: [AuthController],
  exports: [TypeOrmModule, AuthService],
})
export class AuthModule {}