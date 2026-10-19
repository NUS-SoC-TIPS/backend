import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS,
  CLOUDFLARE_TURN_CREDENTIALS_URL,
  CLOUDFLARE_TURN_REQUEST_TIMEOUT_MS,
  DEFAULT_STUN_URLS,
} from './webrtc.constants';
import { RTCIceServerConfig } from './webrtc.interfaces';

interface CachedTurnServer {
  server: RTCIceServerConfig;
  expiresAt: number; // epoch ms after which the cache must be refreshed
}

@Injectable()
export class WebrtcService {
  private cachedCloudflareTurn: CachedTurnServer | null = null;
  private inFlightCloudflareTurn: Promise<RTCIceServerConfig | null> | null =
    null;

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
   *   minted server-side so the API token never reaches the browser, and
   *   are cached and shared across joins until halfway through their TTL.
   *
   * Returns STUN-only configuration when TURN is not configured or cannot
   * be minted; direct connections still succeed for most networks. This
   * method never throws, as it runs after the point of no return in joinRoom.
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

    const cloudflareTurn = await this.getCloudflareTurnServer();
    if (cloudflareTurn != null) {
      iceServers.push(cloudflareTurn);
    }
    return iceServers;
  }

  private buildStaticTurnServer(): RTCIceServerConfig | null {
    const urls = this.getConfiguredList('WEBRTC_TURN_URLS', []);
    const username = this.getConfiguredString('WEBRTC_TURN_USERNAME');
    const credential = this.getConfiguredString('WEBRTC_TURN_CREDENTIAL');
    if (urls.length === 0 || username == null || credential == null) {
      return null;
    }
    return { urls, username, credential };
  }

  private getCloudflareTurnServer(): Promise<RTCIceServerConfig | null> {
    if (
      this.cachedCloudflareTurn != null &&
      this.cachedCloudflareTurn.expiresAt > Date.now()
    ) {
      return Promise.resolve(this.cachedCloudflareTurn.server);
    }
    // Concurrent joins share a single minting request.
    if (this.inFlightCloudflareTurn == null) {
      this.inFlightCloudflareTurn = this.mintCloudflareTurnServer().finally(
        () => {
          this.inFlightCloudflareTurn = null;
        },
      );
    }
    return this.inFlightCloudflareTurn;
  }

  private async mintCloudflareTurnServer(): Promise<RTCIceServerConfig | null> {
    const tokenId = this.getConfiguredString('WEBRTC_CLOUDFLARE_TURN_TOKEN_ID');
    const apiToken = this.getConfiguredString(
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
          // Joining a room waits on this, so never let it hang.
          signal: AbortSignal.timeout(CLOUDFLARE_TURN_REQUEST_TIMEOUT_MS),
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
      const server = this.withoutBrowserBlockedUrls(body.iceServers);
      if (server == null) {
        this.logger.error(
          'Cloudflare TURN credential response had no usable ICE servers; clients will fall back to STUN-only.',
          undefined,
          WebrtcService.name,
        );
        return null;
      }
      this.cachedCloudflareTurn = {
        server,
        // Refresh at half the TTL so handed-out credentials always have
        // plenty of validity left for the duration of an interview.
        expiresAt:
          Date.now() + (CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS * 1000) / 2,
      };
      return server;
    } catch (e: unknown) {
      this.logger.error(
        'Cloudflare TURN credential minting threw; clients will fall back to STUN-only.',
        e instanceof Error ? e.stack : undefined,
        WebrtcService.name,
      );
      return null;
    }
  }

  // Browsers block port 53, so Cloudflare's `:53` TURN URLs only cause ICE
  // gathering timeouts. Cloudflare recommends filtering them out client-side.
  private withoutBrowserBlockedUrls(
    server: RTCIceServerConfig | undefined,
  ): RTCIceServerConfig | null {
    if (server == null) {
      return null;
    }
    const urls = (
      Array.isArray(server.urls) ? server.urls : [server.urls]
    ).filter((url) => !/:53(\?|$)/.test(url));
    if (urls.length === 0) {
      return null;
    }
    return { ...server, urls };
  }

  // Treats blank values as unset, since `.env` files typically declare
  // every key with an empty value.
  private getConfiguredString(key: string): string | null {
    const raw = this.configService.get<string>(key)?.trim();
    return raw == null || raw === '' ? null : raw;
  }

  private getConfiguredList(key: string, fallback: string[]): string[] {
    const raw = this.getConfiguredString(key);
    if (raw == null) {
      return fallback;
    }
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');
  }
}
