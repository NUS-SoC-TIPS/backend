import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { JwtRestAdminGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { WindowItem } from './windows.interfaces';
import { WindowsService } from './windows.service';

@UseGuards(JwtRestAdminGuard)
@Controller('windows')
export class WindowsController {
  constructor(
    private readonly logger: Logger,
    private readonly windowsService: WindowsService,
  ) {}

  @Get(':id')
  @UseFilters(BadRequestExceptionFilter)
  findWindow(@Param('id') id: string): Promise<WindowItem> {
    this.logger.log('GET /windows/:id', WindowsController.name);
    return this.windowsService.findWindow(+id);
  }

  @Delete(':id')
  @UseFilters(BadRequestExceptionFilter)
  deleteWindow(@Param('id') id: string): Promise<void> {
    this.logger.log('DELETE /windows/:id', WindowsController.name);
    return this.windowsService.deleteWindow(+id);
  }

  @Post(':id/autoexclude')
  @UseFilters(BadRequestExceptionFilter)
  autoExclude(@Param('id') id: string): Promise<number> {
    this.logger.log('POST /windows/:id/autoexclude', WindowsController.name);
    return this.windowsService.autoExclude(+id);
  }

  @Post(':id/pairs')
  @UseFilters(BadRequestExceptionFilter)
  pairStudents(@Param('id') id: string): Promise<number> {
    this.logger.log('POST /windows/:id/pairs', WindowsController.name);
    return this.windowsService.pairStudents(+id);
  }
}
