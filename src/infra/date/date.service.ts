import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

import 'dayjs/locale/en-sg';

@Injectable()
export class DateService implements OnModuleInit {
  constructor(private readonly logger: Logger) {}

  async onModuleInit(): Promise<void> {
    // Configure dayjs globally
    dayjs.locale('en-sg');
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.tz.setDefault('Asia/Singapore');
    dayjs.extend(weekday);
    dayjs.extend(customParseFormat);
    this.logger.log('DayJS configured!', DateService.name);
  }

  findStartOfWeek(): Date {
    return dayjs().tz().startOf('week').toDate();
  }

  findEndOfWeek(): Date {
    return dayjs().tz().endOf('week').toDate();
  }

  // What we want to work with is the date string, which we will treat as an SG date
  // Use Date#toDateString() to get the string for this.
  findStartOfDay(date: string): Date {
    return dayjs(date).tz().startOf('day').toDate();
  }

  // What we want to work with is the date string, which we will treat as an SG date
  // Use Date#toDateString() to get the string for this.
  findEndOfDay(date: string): Date {
    return dayjs(date).tz().endOf('day').toDate();
  }
}
