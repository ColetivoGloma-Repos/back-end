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
  ListDonationsDto,
  UpdateDonationDto,
} from '../dto/donation';
import { Donation } from '../entities/donation.entity';

@ApiTags('Donations')
@Controller('donation')
export class DonationController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: CreateDonationDto): Promise<Donation> {
    return this.donationsService.create(body);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async list(@Query() query: ListDonationsDto) {
    return this.donationsService.list(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findById(@Param('id') id: string): Promise<Donation> {
    return this.donationsService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDonationDto,
  ): Promise<Donation> {
    return this.donationsService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async cancel(@Param('id') id: string): Promise<{ ok: true }> {
    return this.donationsService.cancel(id);
  }
}
