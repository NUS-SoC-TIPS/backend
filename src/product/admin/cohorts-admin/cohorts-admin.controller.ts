import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { JwtRestAdminGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';
import { WindowBase } from '../../interfaces';

import {
  CohortAdminItem,
  CohortAdminUpdateResult,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import { CohortsAdminService } from './cohorts-admin.service';
import {
  CreateCohortDto,
  CreateStudentDto,
  CreateWindowDto,
  UpdateCohortDto,
  UpdateWindowDto,
} from './dtos';

@UseGuards(JwtRestAdminGuard)
@Controller('cohorts_admin')
export class CohortsAdminController {
  constructor(
    private readonly logger: Logger,
    private readonly cohortsAdminService: CohortsAdminService,
  ) {}

  @Get(':id')
  @UseFilters(BadRequestExceptionFilter)
  findCohort(@Param('id') id: string): Promise<CohortAdminItem> {
    this.logger.log('GET /cohorts_admin/:id', CohortsAdminController.name);
    return this.cohortsAdminService.findCohort(+id);
  }

  @Post()
  @UseFilters(BadRequestExceptionFilter)
  createCohort(@Body() dto: CreateCohortDto): Promise<{ id: number }> {
    this.logger.log('POST /cohorts_admin', CohortsAdminController.name);
    return this.cohortsAdminService.createCohort(dto);
  }

  @Patch(':id')
  @UseFilters(BadRequestExceptionFilter)
  updateCohort(
    @Param('id') id: string,
    @Body() dto: UpdateCohortDto,
  ): Promise<CohortAdminUpdateResult> {
    this.logger.log('PATCH /cohorts_admin/:id', CohortsAdminController.name);
    return this.cohortsAdminService.updateCohort(+id, dto);
  }

  @Post(':id/windows')
  @UseFilters(BadRequestExceptionFilter)
  createWindow(
    @Param('id') id: string,
    @Body() dto: CreateWindowDto,
  ): Promise<WindowBase> {
    this.logger.log(
      'POST /cohorts_admin/:id/windows',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.createWindow(+id, dto);
  }

  @Patch(':id/windows')
  @UseFilters(BadRequestExceptionFilter)
  updateWindow(
    @Param('id') id: string,
    @Body() dto: UpdateWindowDto,
  ): Promise<WindowBase> {
    this.logger.log(
      'PATCH /cohorts_admin/:id/windows',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.updateWindow(+id, dto);
  }

  // Temp route to remedy some bugs
  @Post(':id/windows/rematch')
  @UseFilters(BadRequestExceptionFilter)
  rematchWindows(@Param('id') id: string): Promise<void> {
    this.logger.log(
      'POST /cohorts_admin/:id/windows/rematch',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.rematchWindows(+id);
  }

  @Post(':id/students/validate')
  @UseFilters(BadRequestExceptionFilter)
  validateStudents(
    @Param('id') id: string,
    @Body() dto: CreateStudentDto[],
  ): Promise<CohortStudentValidationResult> {
    this.logger.log(
      'POST /cohorts_admin/:id/students/validate',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.validateStudents(+id, dto);
  }

  @Post(':id/students/create')
  @UseFilters(BadRequestExceptionFilter)
  createStudents(
    @Param('id') id: string,
    @Body() dto: CreateStudentDto[],
  ): Promise<CohortStudentValidationResult> {
    this.logger.log(
      'POST /cohorts_admin/:id/students/create',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.createStudents(+id, dto);
  }
}
