import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Exclusion, Window } from '@prisma/client';

import { JwtRestAdminGuard } from '../auth/guards';
import { handleRestError } from '../utils/error.util';

import { AdminService } from './admin.service';
import { CreateExclusionDto } from './dtos';
import { AdminStatsEntity } from './entities';

@UseGuards(JwtRestAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: Logger,
  ) {}

  @Get('windows')
  findWindows(): Promise<Window[]> {
    this.logger.log('GET /admin/windows', AdminController.name);
    return this.adminService.findWindows().catch(handleRestError());
  }

  @Get('stats/:id')
  findStats(@Param('id') windowId: string): Promise<AdminStatsEntity> {
    this.logger.log(`GET /admin/stats/${windowId}`, AdminController.name);
    return this.adminService.findStats(+windowId).catch(handleRestError());
  }

  @Post('exclusions')
  createExclusion(@Body() dto: CreateExclusionDto): Promise<Exclusion> {
    this.logger.log('POST /admin/exclusions', AdminController.name);
    return this.adminService.createExclusion(dto).catch(handleRestError());
  }

  @Delete('exclusions/:id')
  removeExclusion(@Param('id') exclusionId: string): Promise<void> {
    this.logger.log(
      `DELETE /admin/exclusions/${exclusionId}`,
      AdminController.name,
    );
    return this.adminService
      .removeExclusion(+exclusionId)
      .catch(handleRestError());
  }
}
