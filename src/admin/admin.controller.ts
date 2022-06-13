import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Exclusion, Window } from '@prisma/client';

import { JwtRestAdminGuard } from '../auth/guards';

import { AdminService } from './admin.service';
import { CreateExclusionDto } from './dtos';
import { AdminStatsEntity } from './entities';

@UseGuards(JwtRestAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('windows')
  findWindows(): Promise<Window[]> {
    return this.adminService.findWindows();
  }

  @Get('stats/:id')
  findStats(@Param('id') windowId: string): Promise<AdminStatsEntity> {
    return this.adminService.findStats(+windowId);
  }

  @Post('exclusions')
  createExclusion(@Body() dto: CreateExclusionDto): Promise<Exclusion> {
    return this.adminService.createExclusion(dto);
  }

  @Delete('exclusions/:id')
  removeExclusion(@Param('id') exclusionId: string): Promise<void> {
    return this.adminService.removeExclusion(+exclusionId);
  }
}
