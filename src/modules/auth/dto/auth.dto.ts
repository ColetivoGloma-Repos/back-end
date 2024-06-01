import { IsEmail, IsString, MinLength, IsBoolean, IsDate, IsOptional, IsEmpty, IsArray, IsIn, IsEnum } from 'class-validator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { CreateAddressDto } from './adress.dto';
export enum Status {
  WAITING = 'waiting',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
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
  @IsOptional()
  username: string;

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
  @IsDate()
  @IsOptional()
  birthDate: Date;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isDonor: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isCoordinator: boolean;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  @IsIn(['donor', 'coordinator', 'both', 'admin'], { each: true })
  roles: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  hasVehicle: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  vehicleType: string;

  
  @ApiProperty({ enum: Status, default: Status.APPROVED })
  @IsEnum(Status)
  @IsOptional()
  status: Status;
}