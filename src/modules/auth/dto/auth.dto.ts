import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateAddressDto } from './adress.dto';
import { EAuthRoles, Status } from '../enums/auth';

export class CreateUserDto {
  @ApiHideProperty()
  @IsEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: () => CreateAddressDto })
  address: CreateAddressDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  birthDate: string;

  @ApiProperty({ enum: EAuthRoles, default: EAuthRoles.USER, isArray: true })
  @IsArray()
  @IsOptional()
  @IsEnum(EAuthRoles, { each: true })
  roles: EAuthRoles[];

  @ApiProperty({ nullable: true })
  @IsBoolean()
  @IsOptional()
  hasVehicle: boolean;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  vehicleType: string;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  color: string;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  identifier: string;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  brand: string;

  @ApiProperty({ enum: Status, default: Status.WAITING })
  @IsEnum(Status)
  @IsOptional()
  status: Status;

  @ApiHideProperty()
  @IsOptional()
  code: string;
}
