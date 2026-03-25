import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DistributionPoint } from '../entities/distribution-point.entity';
import { DistributionPointService } from '../services/distribution-point.service';
import {
  CreateDistributionPointDto,
  ListDistributionPointsDto,
  UpdateDistributionPointDto,
} from '../dto/distribution-point';
import { CreateUserDto } from 'src/modules/auth/dto/auth.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@ApiTags('DistributionPoint')
@Controller('distribution-point')
export class DistributionPointController {
  constructor(private readonly service: DistributionPointService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin')
  async create(
    @CurrentUser() currentUser: CreateUserDto,
    @Body() body: CreateDistributionPointDto,
  ): Promise<DistributionPoint> {
    return this.service.create(body, {
      roles: currentUser.roles,
      userId: currentUser.id,
    });
  }

  @Get()
  async list(@Query() query: ListDistributionPointsDto) {
    return this.service.list(query);
  }

  @Get(':id([0-9a-fA-F-]{36})')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<DistributionPoint> {
    return this.service.findById(id, {
      address: true,
      files: true,
    });
  }

  @Patch(':id([0-9a-fA-F-]{36})')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin')
  async update(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateDistributionPointDto,
  ): Promise<DistributionPoint> {
    return this.service.update(id, body, {
      roles: currentUser.roles,
      userId: currentUser.id,
    });
  }

  @Delete(':id([0-9a-fA-F-]{36})')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin')
  async remove(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ ok: true }> {
    return this.service.remove(id, {
      roles: currentUser.roles,
      userId: currentUser.id,
    });
  }
}
