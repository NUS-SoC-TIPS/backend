import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

import { AGORA_TOKEN_DURATION } from './agora.constants';

@Injectable()
export class AgoraService {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(roomId: number, userId: string): string | null {
    this.logger.debug('Generating Agora access token...', AgoraService.name);
    const agoraAppId = this.configService.get('AGORA_APP_ID');
    const agoraAppCertificate = this.configService.get('AGORA_APP_CERTIFICATE');
    if (agoraAppId == null || agoraAppCertificate == null) {
      this.logger.error(
        'Agora app ID or certificate not defined, failed to generate access token.',
        undefined,
        AgoraService.name,
      );
      return null;
    }

    this.logger.debug('Agora access token generated!', AgoraService.name);
    return RtcTokenBuilder.buildTokenWithAccount(
      agoraAppId,
      agoraAppCertificate,
      `${roomId}`, // Need to send the same ID to the frontend
      userId,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + AGORA_TOKEN_DURATION, // This is when the token will expire
    );
  }
}
