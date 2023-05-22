import {
  Body,
  Controller,
  Delete,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { JwtRestAdminGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { CreateExclusionDto } from './dtos';
import { ExclusionsService } from './exclusions.service';

@UseGuards(JwtRestAdminGuard)
@Controller('exclusions')
export class ExclusionsController {
  constructor(
    private readonly logger: Logger,
    private readonly exclusionsService: ExclusionsService,
  ) {}

  @Post()
  @UseFilters(BadRequestExceptionFilter)
  createExclusion(@Body() dto: CreateExclusionDto): Promise<void> {
    this.logger.log('POST /exclusions', ExclusionsController.name);
    return this.exclusionsService.createExclusion(dto);
  }

  @Delete(':id')
  @UseFilters(BadRequestExceptionFilter)
  removeExclusion(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /exclusions/${id}`, ExclusionsController.name);
    return this.exclusionsService.removeExclusion(+id);
  }
}
