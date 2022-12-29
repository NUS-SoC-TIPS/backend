import { BadRequestException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export const handleRestError =
  (message?: string) =>
  (_: any): never => {
    throw new BadRequestException(message);
  };

export const handleWsError =
  (message: string) =>
  (_: any): never => {
    throw new WsException(message);
  };
