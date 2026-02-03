import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DonationsService } from '../services/donation.service';
import {
  CreateDonationDto,
  DeleteDonationDto,
  ListDonationsDto,
} from '../dto/donation';
import { Donation } from '../entities/donation.entity';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { CreateUserDto } from 'src/modules/auth/dto/auth.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@ApiTags('DistributionPointDonations')
@Controller('/distribution-point/donation')
export class DonationController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin', 'user')
  async create(
    @CurrentUser() currentUser: CreateUserDto,
    @Body() body: CreateDonationDto,
  ): Promise<Donation> {
    return this.donationsService.create(body, {
      roles: currentUser.roles,
      userId: currentUser.id,
    });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin', 'user')
  async listAll(
    @CurrentUser() currentUser: CreateUserDto,
    @Query() query: ListDonationsDto,
  ) {
    return this.donationsService.list(query, {
      roles: currentUser.roles,
      userId: currentUser.id,
    });
  }

  @Delete(':donationId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin', 'user')
  async cancel(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('donationId') donationId: string,
    @Query() query: DeleteDonationDto,
  ): Promise<{ ok: true }> {
    return this.donationsService.cancel(
      { ...query, donationId },
      {
        roles: currentUser.roles,
        userId: currentUser.id,
      },
    );
  }

  @Patch(':donationId/delivered')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Roles('coordinator', 'admin')
  async confirmDeliveryAllDonations(
    @Param('donationId') donationId: string,
  ): Promise<Donation> {
    return this.donationsService.delivered(donationId);
  }
}
