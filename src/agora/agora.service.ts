import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

import { AGORA_TOKEN_DURATION } from './agora.constants';

@Injectable()
export class AgoraService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  generateAccessToken(roomId: number, userId: string): string | null {
    const agoraAppId = this.configService.get('AGORA_APP_ID');
    const agoraAppCertificate = this.configService.get('AGORA_APP_CERTIFICATE');
    if (agoraAppId == null || agoraAppCertificate == null) {
      this.logger.warn(
        'Agora app ID or certificate not defined, could not generate access token.',
        AgoraService.name,
      );
      return null;
    }

    return RtcTokenBuilder.buildTokenWithAccount(
      agoraAppId,
      agoraAppCertificate,
      `${roomId}`,
      userId,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + AGORA_TOKEN_DURATION, // This is when the token will expire
    );
  }
}
