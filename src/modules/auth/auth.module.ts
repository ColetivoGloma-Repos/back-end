import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth.enity';
import { Address } from './entities/adress.enity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { CompanyModule } from '../company/company.module';
import { EnvConfig } from 'src/config';
import { Shelter } from '../shelter/entities/shelter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, Shelter]),
    CompanyModule,
    JwtModule.register({
      secret: EnvConfig.JWT_SECRET.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [TypeOrmModule, AuthService],
})
export class AuthModule {}