import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

@Injectable()
export class AgoraService {
  constructor(private configService: ConfigService) {}

  generateAccessToken(roomId: number, userId: string): string {
    return RtcTokenBuilder.buildTokenWithAccount(
      this.configService.get('AGORA_APP_ID'),
      this.configService.get('AGORA_APP_CERTIFICATE'),
      `${roomId}`,
      userId,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600, // User will use this token within 1 hour from now
    );
  }
}
