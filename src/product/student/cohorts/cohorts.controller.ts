import {
  Controller,
  Get,
  Logger,
  Param,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../../../infra/prisma/generated';
import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestStudentOrAdminGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { CohortItem, CohortListItem } from './cohorts.interfaces';
import { CohortsService } from './cohorts.service';

@UseGuards(JwtRestStudentOrAdminGuard)
@Controller('cohorts')
export class CohortsController {
  constructor(
    private readonly logger: Logger,
    private readonly cohortsService: CohortsService,
  ) {}

  @Get()
  @UseFilters(BadRequestExceptionFilter)
  async findCohorts(
    @GetUserRest('id') userId: string,
    @GetUserRest('role') userRole: UserRole,
  ): Promise<CohortListItem[]> {
    this.logger.log('GET /cohorts', CohortsController.name);
    return this.cohortsService.findCohorts(userId, userRole);
  }

  @Get(':id')
  @UseFilters(BadRequestExceptionFilter)
  async findCohort(
    @Param('id') id: string,
    @GetUserRest('id') userId: string,
    @GetUserRest('role') userRole: UserRole,
  ): Promise<CohortItem> {
    this.logger.log('GET /cohorts/:id', CohortsController.name);
    return this.cohortsService.findCohort(+id, userId, userRole);
  }
}
