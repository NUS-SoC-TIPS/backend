import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { User } from '../../../infra/prisma/generated';
import { ExcuseBase } from '../../../product/interfaces/excuses';
import { GetUserRest } from '../../../productinfra/decorators';
import {
  JwtRestAdminGuard,
  JwtRestStudentOrAdminGuard,
} from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { CreateExcuseDto } from './dtos/create-excuse.dto';
import { UpdateExcuseDto } from './dtos/update-excuse.dto';
import { ExcusesService } from './excuses.service';

@UseGuards(JwtRestStudentOrAdminGuard)
@Controller('excuses')
export class ExcusesController {
  constructor(
    private readonly logger: Logger,
    private readonly excusesService: ExcusesService,
  ) {}

  @UseGuards(JwtRestAdminGuard)
  @Get()
  @UseFilters(BadRequestExceptionFilter)
  findAllExcuses(@Query('cohortId') id: string): Promise<ExcuseBase[]> {
    this.logger.log('GET /excuses', ExcusesController.name);
    return this.excusesService.findAllExcuses(+id);
  }

  @Get('/self')
  @UseFilters(BadRequestExceptionFilter)
  findSelfExcuse(
    @GetUserRest() user: User,
    @Query('windowId') windowId?: string,
  ): Promise<ExcuseBase[]> {
    this.logger.log('GET /excuses/self', ExcusesController.name);
    const windowIdNumber = windowId ? +windowId : undefined;
    return this.excusesService.findSelf(user, windowIdNumber);
  }

  @Get(':id')
  @UseFilters(BadRequestExceptionFilter)
  findWindow(@Param('id') id: string): Promise<ExcuseBase> {
    this.logger.log('GET /excuses/:id', ExcusesController.name);
    return this.excusesService.findExcuse(+id);
  }

  @Delete(':id')
  @UseFilters(BadRequestExceptionFilter)
  deleteExcuse(@Param('id') id: string): Promise<void> {
    this.logger.log('DELETE /excuses/:id', ExcusesController.name);
    return this.excusesService.deleteExcuse(+id);
  }

  @Post('/create')
  @UseFilters(BadRequestExceptionFilter)
  createExcuse(@Body() dto: CreateExcuseDto): Promise<number> {
    this.logger.log('POST /excuses/create', ExcusesController.name);

    return this.excusesService.createExcuse(dto);
  }

  @Put(':id')
  @UseFilters(BadRequestExceptionFilter)
  updateExcuse(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateExcuseDto>,
  ): Promise<number> {
    this.logger.log('PUT /excuses/:id', ExcusesController.name);

    return this.excusesService.updateExcuse(+id, dto);
  }
}
