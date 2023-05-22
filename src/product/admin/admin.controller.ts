import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { JwtRestAdminGuard } from '../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../utils';

import { AdminOverview } from './admin.interfaces';
import { AdminService } from './admin.service';

@UseGuards(JwtRestAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly logger: Logger,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  @UseFilters(BadRequestExceptionFilter)
  findOverview(): Promise<AdminOverview> {
    this.logger.log('GET /admin', AdminController.name);
    return this.adminService.findOverview();
  }
}
