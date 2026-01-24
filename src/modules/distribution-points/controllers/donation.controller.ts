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
import { CreateDonationDto, ListDonationsDto } from '../dto/donation';
import { Donation } from '../entities/donation.entity';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { CreateUserDto } from 'src/modules/auth/dto/auth.dto';

@ApiTags('DistributionPointDonations')
@Controller('/distribution-point/donation')
export class DonationController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @CurrentUser() currentUser: CreateUserDto,
    @Body() body: CreateDonationDto,
  ): Promise<Donation> {
    return this.donationsService.create(currentUser.id, body);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async list(
    @CurrentUser() currentUser: CreateUserDto,
    @Query() query: ListDonationsDto,
  ) {
    return this.donationsService.list(currentUser.id, query);
  }

  @Delete(':donationId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async cancel(
    @CurrentUser() currentUser: CreateUserDto,
    @Param('donationId') donationId: string,
  ): Promise<{ ok: true }> {
    return this.donationsService.cancel(currentUser.id, donationId);
  }

  @Patch(':donationId/confirm-delivered')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async confirmDeliveryAllDonations(
    @Param('donationId') donationId: string,
  ): Promise<Donation> {
    return this.donationsService.confirmDelivery(donationId);
  }
}
