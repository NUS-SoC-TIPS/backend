import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Exclusion, Window } from '../../infra/prisma/generated';
import { JwtRestAdminGuard } from '../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../utils';

import { AdminService } from './admin.service';
import { CreateExclusionDto } from './dtos';
import { AdminStatsEntity } from './entities';

@UseGuards(JwtRestAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly logger: Logger,
    private readonly adminService: AdminService,
  ) {}

  @Get('windows')
  @UseFilters(BadRequestExceptionFilter)
  findWindows(): Promise<Window[]> {
    this.logger.log('GET /admin/windows', AdminController.name);
    return this.adminService.findWindows();
  }

  @Get('stats/:id')
  @UseFilters(BadRequestExceptionFilter)
  findStats(@Param('id') windowId: string): Promise<AdminStatsEntity> {
    this.logger.log(`GET /admin/stats/${windowId}`, AdminController.name);
    return this.adminService.findStats(+windowId);
  }

  @Post('exclusions')
  @UseFilters(BadRequestExceptionFilter)
  createExclusion(@Body() dto: CreateExclusionDto): Promise<Exclusion> {
    this.logger.log('POST /admin/exclusions', AdminController.name);
    return this.adminService.createExclusion(dto);
  }

  @Delete('exclusions/:id')
  @UseFilters(BadRequestExceptionFilter)
  removeExclusion(@Param('id') exclusionId: string): Promise<void> {
    this.logger.log(
      `DELETE /admin/exclusions/${exclusionId}`,
      AdminController.name,
    );
    return this.adminService.removeExclusion(+exclusionId);
  }
}
