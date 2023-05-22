import {
  Controller,
  Get,
  Logger,
  Param,
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
}
