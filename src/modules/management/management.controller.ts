import { Get, Post, Patch, Delete, Param, UseGuards, Body, Controller, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateManagementDTO } from './dto/request/createManagementDTO';
import { ManagementService } from './management.service';
import { ResponseDefaultManagement } from './dto/response/responseDefaultManagement';

import { UpdateManagementDTO } from './dto/request/updateManagementDTO';
import { DeleteManagementDto } from './dto/request/delelteManagementDto';
import { SearchManagement } from './dto/request/searchManagement';
import { ResponsePaginateManagement } from './dto/response/responsePaginateManagement';


@ApiTags('Management')
@Controller('management')
export class ManagementController {
  constructor(
    private managementService: ManagementService
  ){}

  @Post('/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createManagementDTO: CreateManagementDTO) {
    return new ResponseDefaultManagement(await this.managementService.create(createManagementDTO));
  }

  @Patch('/:managementId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('managementId') managementId: string,@Body() updates: UpdateManagementDTO) {
   
    return new ResponseDefaultManagement(await this.managementService.update(managementId, updates));
  }

  @Get('/find-all')
  async listAll(@Query() query: SearchManagement) {
    const { data, total } = await this.managementService.findAll(query);
    const response = new ResponsePaginateManagement(data, total);
    return response;
  }

  @Get('/find-all-by-user/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async listAllByUser(@Param('id') id: string) {
    const managements = await this.managementService.findAllByUser(id)
    return managements.map((m) => new ResponseDefaultManagement(m));
  }

  @Get('/:managementId')
  async findOne(@Param('managementId') managementId: string) {
    return new ResponseDefaultManagement(await this.managementService.findById(managementId));
  }


  @Delete('/:managementId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('managementId') managementId: string, @Body() userId: DeleteManagementDto) {
    return await this.managementService.delete(managementId, userId.userId);
  }

  @Patch('/:managementId/add-need/:needId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async addNeed(
   @Param('managementId') managementId: string,
   @Param('needId') needId: string ) {
    
    return await this.managementService.addNeed(managementId, needId);
  }

  @Delete('/:managementId/add-need/:needId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async removeNeed(
   @Param('managementId') managementId: string,
   @Param('needId') needId: string ) {
   return await this.managementService.removeNeed(managementId, needId);
  }
}