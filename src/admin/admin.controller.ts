import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtRestAdminGuard } from '../auth/guards';

import { AdminService } from './admin.service';
import { AdminStatsEntity } from './entities';

@UseGuards(JwtRestAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async findStats(): Promise<AdminStatsEntity> {
    return this.adminService.findStats();
  }
}
