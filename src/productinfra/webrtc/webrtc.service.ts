import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS,
  CLOUDFLARE_TURN_CREDENTIALS_URL,
  DEFAULT_STUN_URLS,
} from './webrtc.constants';
import { RTCIceServerConfig } from './webrtc.interfaces';

@Injectable()
export class WebrtcService {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Builds the ICE server list handed to clients when they join a room.
   *
   * The list is assembled from environment configuration so the TURN
   * provider can be swapped (or self-hosted later) without code changes:
   *
   * - STUN: `WEBRTC_STUN_URLS` (comma-separated), defaulting to the free
   *   Cloudflare and Google STUN servers.
   * - TURN, static credentials: `WEBRTC_TURN_URLS`,
   *   `WEBRTC_TURN_USERNAME`, `WEBRTC_TURN_CREDENTIAL`.
   * - TURN, Cloudflare Realtime: `WEBRTC_CLOUDFLARE_TURN_TOKEN_ID` and
   *   `WEBRTC_CLOUDFLARE_TURN_API_TOKEN`. Short-lived credentials are
   *   minted server-side so the API token never reaches the browser
   *   (Cloudflare's TURN free tier includes 1,000 GB of relay egress
   *   per month, covering the ~10-20% of calls that cannot connect
   *   directly).
   *
   * Returns STUN-only configuration when TURN is not configured; direct
   * connections still succeed for most networks.
   */
  async getIceServers(): Promise<RTCIceServerConfig[]> {
    const stunUrls = this.getConfiguredList(
      'WEBRTC_STUN_URLS',
      DEFAULT_STUN_URLS,
    );
    const iceServers: RTCIceServerConfig[] = [{ urls: stunUrls }];

    const staticTurn = this.buildStaticTurnServer();
    if (staticTurn != null) {
      iceServers.push(staticTurn);
      return iceServers;
    }

    const cloudflareTurn = await this.mintCloudflareTurnServer();
    if (cloudflareTurn != null) {
      iceServers.push(cloudflareTurn);
    }
    return iceServers;
  }

  private buildStaticTurnServer(): RTCIceServerConfig | null {
    const urls = this.getConfiguredList('WEBRTC_TURN_URLS', []);
    const username = this.configService.get<string>('WEBRTC_TURN_USERNAME');
    const credential = this.configService.get<string>(
      'WEBRTC_TURN_CREDENTIAL',
    );
    if (urls.length === 0 || username == null || credential == null) {
      return null;
    }
    return { urls, username, credential };
  }

  private async mintCloudflareTurnServer(): Promise<RTCIceServerConfig | null> {
    const tokenId = this.configService.get<string>(
      'WEBRTC_CLOUDFLARE_TURN_TOKEN_ID',
    );
    const apiToken = this.configService.get<string>(
      'WEBRTC_CLOUDFLARE_TURN_API_TOKEN',
    );
    if (tokenId == null || apiToken == null) {
      return null;
    }

    try {
      const response = await fetch(
        `${CLOUDFLARE_TURN_CREDENTIALS_URL}/${tokenId}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ttl: CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS,
          }),
        },
      );
      if (!response.ok) {
        this.logger.error(
          `Cloudflare TURN credential minting failed with status ${response.status}; clients will fall back to STUN-only.`,
          undefined,
          WebrtcService.name,
        );
        return null;
      }
      const body = (await response.json()) as {
        iceServers?: RTCIceServerConfig;
      };
      return body.iceServers ?? null;
    } catch (e: unknown) {
      this.logger.error(
        'Cloudflare TURN credential minting threw; clients will fall back to STUN-only.',
        e instanceof Error ? e.stack : undefined,
        WebrtcService.name,
      );
      return null;
    }
  }

  private getConfiguredList(
    key: string,
    fallback: string[],
  ): string[] {
    const raw = this.configService.get<string>(key);
    if (raw == null || raw.trim() === '') {
      return fallback;
    }
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');
  }
}
