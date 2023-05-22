import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { JwtRestAdminGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import {
  CohortAdminItem,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import { CohortsAdminService } from './cohorts-admin.service';
import { CreateStudentDto, CreateUpdateCohortDto } from './dtos';

@UseGuards(JwtRestAdminGuard)
@Controller('cohorts_admin')
export class CohortsAdminController {
  constructor(
    private readonly logger: Logger,
    private readonly cohortsAdminService: CohortsAdminService,
  ) {}

  @Get('id')
  @UseFilters(BadRequestExceptionFilter)
  findCohort(@Param('id') id: string): Promise<CohortAdminItem> {
    this.logger.log('GET /cohorts_admin/:id', CohortsAdminController.name);
    return this.cohortsAdminService.findCohort(+id);
  }

  @Post()
  @UseFilters(BadRequestExceptionFilter)
  createOrUpdateCohort(@Body() dto: CreateUpdateCohortDto): Promise<void> {
    this.logger.log('POST /cohorts_admin', CohortsAdminController.name);
    return this.cohortsAdminService.createOrUpdateCohort(dto);
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
