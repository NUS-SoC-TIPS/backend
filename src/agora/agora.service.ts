import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

import { AGORA_TOKEN_DURATION } from './agora.constants';

@Injectable()
export class AgoraService {
  constructor(private readonly configService: ConfigService) {}

  generateAccessToken(roomId: number, userId: string): string {
    return RtcTokenBuilder.buildTokenWithAccount(
      this.configService.get('AGORA_APP_ID'),
      this.configService.get('AGORA_APP_CERTIFICATE'),
      `${roomId}`,
      userId,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + AGORA_TOKEN_DURATION,
    );
  }
}
