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

import {
  CohortAdminItem,
  CohortAdminUpdateResult,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import { CohortsAdminService } from './cohorts-admin.service';
import {
  CreateCohortDto,
  CreateStudentDto,
  CreateUpdateWindowsDto,
  UpdateCohortDto,
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
  createOrUpdateWindows(
    @Param('id') id: string,
    @Body() dto: CreateUpdateWindowsDto,
  ): Promise<void> {
    this.logger.log(
      'Post /cohorts_admin/:id/windows',
      CohortsAdminController.name,
    );
    return this.cohortsAdminService.createOrUpdateWindows(+id, dto);
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
