import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/auth.enity';
import { hash, compare, genSalt } from 'bcrypt';
import { Address } from './entities/adress.enity';
import { CreateUserDto } from './dto/auth.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtPayload } from './payload/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import logger from 'src/logger';
import { CompanyService } from '../company/company.service';
import { ResetPasswordDto } from './dto/resetpassword.dto';
import { SendMailResetPasswordDto } from '../mail/dto/sendmailresetpassword.dto';
import { ChangePasswordDto } from './dto/changepassword.dto';
import { Status } from './enums/auth';
import { UpdateUserDto } from './dto/update.dto';
import { geoResult } from '../company/utils/geoResult';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private jwtService: JwtService,
    private companyService: CompanyService,
  ) {}

  async validateUser(payload: JwtPayload) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException();
    }
    return user;
  }

  public async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['address', 'files'],
    });
  
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  
    let fileUrl = null;
    if (user.files && user.files.length > 0) {
      const latestFile = user.files[user.files.length - 1];
      user.files = [latestFile];
      fileUrl = latestFile.url;
    }
  
    const result = { ...user };
    delete result.password;
    
    return {
      status: 200,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthDate: user.birthDate,
        roles: user.roles,
        hasVehicle: user.hasVehicle,
        vehicleType: user.vehicleType,
        status: user.status,
        code: user.code,
        address: user.address,
        url: fileUrl,       
      },
    };
  }

  public async register(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.usersRepository.findOne({
        where: [{ email: createUserDto.email }],
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }

      const user = new User();
      Object.assign(user, createUserDto);

      const salt = await genSalt();

      user.password = await hash(createUserDto.password, salt);

      user.code = generateRandomCode(6);

      const newUser = await this.usersRepository.save(user);

      const payload = {
        email: newUser.email,
        sub: newUser.id,
        roles: newUser.roles,
      };
      const token = this.jwtService.sign(payload);

      return { token };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  public async resetPassword(dto: ResetPasswordDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const newPassword = generateRandomCode(8);
      user.password = await hash(newPassword, 10);

      await this.usersRepository.save(user);

      const mailDto = new SendMailResetPasswordDto(
        user.name,
        newPassword,
        user.email,
      );

      // this.mailService.sendResetPassword(mailDto);

      return { message: 'Senha redefinida com sucesso', newPassword };
    } catch (error) {
      logger.error(error);
      throw new HttpException(
        'Error on reset password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async activateUser(code: string) {
    try {
      const user = await this.usersRepository.findOne({
        where: { code: code },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (user.code !== code) {
        throw new NotFoundException('Código de ativação inválido');
      }

      user.status = Status.APPROVED;

      await this.usersRepository.save(user);

      return { message: 'Usuário ativado com sucesso' };
    } catch (error) {
      logger.error(error);
      throw new HttpException(
        'Error on activate user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async changePassword(dto: ChangePasswordDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }
      debugger;

      const passwordMatches = await compare(dto.oldPassword, user.password);

      if (!passwordMatches) {
        throw new NotFoundException('Senha inválida');
      }

      user.password = await hash(dto.newPassword, 10);

      await this.usersRepository.save(user);

      // this.mailService.sendChangePasswordAlert(user.email, user.name);
      return { message: 'Senha alterada com sucesso' };
    } catch (error) {
      logger.error(error);
      throw new HttpException(
        'Error on change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async deleteAccount(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.usersRepository.delete(userId);

    return { message: 'Conta deletada com sucesso' };
  }

  public async updateAccount(userId: string, updates: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updates.password) {
      updates.password = await hash(updates.password, 10);
    }
  
    /**
     * Se o usuário tentar alterar o email, podemos ter emails
     * repetidos no banco, é bom adicionar uma lógica pra
     * impedir isso ou só impedir que essa rota seja usada pra
     * isso, criando uma outra so pro email
     */

  if (updates.address) {
  const address = new Address();
  address.pais = 'Brazil';
  Object.assign(address, updates.address);
  const newAddress = await geoResult(address);
  const saveAddress = await this.addressRepository.save(newAddress);

  user.address = saveAddress;
  }

    const { address, ...rest } = updates;
    Object.assign(user, rest);

  const updatedUser = await this.usersRepository.save(user);

  delete updatedUser.password;

  return updatedUser;

  }

  public async authenticate(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    const company = await this.companyService.findByEmail(email);

    if (!user && !company) {
      throw new Error('Usuário não encontrado');
    }
    let token = '';
    if (company && !user) {
      const passwordMatchesCompany = await compare(password, company.password);
      if (!passwordMatchesCompany) {
        throw new ForbiddenException('Erro nas credenciais de acesso.');
      }

      const payload = {
        email: company.email,
        sub: company.id,
        roles: ['donor', 'company'],
      };
      token = this.jwtService.sign(payload);
      return { token };
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      throw new Error('Senha inválida');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };
    token = this.jwtService.sign(payload);

    return { token };
  }
  public async findNearbyUsers(userId: string, radius: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['address'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userLatitude = user.address.latitude;
    const userLongitude = user.address.longitude;

    const query = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.phone',
        'user.birthDate',
        'user.isCoordinator',
        'user.roles',
        'user.status',
      ])
      .addSelect(['address.latitude', 'address.longitude'])
      .leftJoin('user.address', 'address')
      .where(
        `6371 * acos(cos(radians(:userLatitude)) * cos(radians(address.latitude)) * cos(radians(address.longitude) - radians(:userLongitude)) + sin(radians(:userLatitude)) * sin(radians(address.latitude))) < :radius`,
        {
          userLatitude,
          userLongitude,
          radius,
        },
      )
      .andWhere('user.id != :userId', { userId });

    return await query.getMany();
  }
}

function generateRandomCode(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
