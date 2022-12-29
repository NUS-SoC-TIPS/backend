import { BadRequestException } from '@nestjs/common';

export const handleRestError =
  (message?: string) =>
  (_: any): never => {
    throw new BadRequestException(message);
  };
