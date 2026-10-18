import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DEFAULT_STUN_URLS } from './webrtc.constants';
import { WebrtcService } from './webrtc.service';

const CLOUDFLARE_ENV = {
  WEBRTC_CLOUDFLARE_TURN_TOKEN_ID: 'token-id',
  WEBRTC_CLOUDFLARE_TURN_API_TOKEN: 'api-token',
};

const makeService = (env: Record<string, string>): WebrtcService => {
  const configService = {
    get: (key: string): string | undefined => env[key],
  } as unknown as ConfigService;
  const logger = { error: jest.fn() } as unknown as Logger;
  return new WebrtcService(logger, configService);
};

const mockCloudflareResponse = (): jest.SpyInstance =>
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      iceServers: {
        urls: [
          'turn:turn.cloudflare.com:3478?transport=udp',
          'turn:turn.cloudflare.com:53?transport=udp',
          'turns:turn.cloudflare.com:443?transport=tcp',
        ],
        username: 'user',
        credential: 'pass',
      },
    }),
  } as Response);

describe('WebrtcService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should default to STUN-only when nothing is configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = makeService({});
    expect(await service.getIceServers()).toEqual([
      { urls: DEFAULT_STUN_URLS },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should treat blank env values as unset', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = makeService({
      WEBRTC_STUN_URLS: ' ',
      WEBRTC_TURN_URLS: '',
      WEBRTC_TURN_USERNAME: '',
      WEBRTC_TURN_CREDENTIAL: '',
      WEBRTC_CLOUDFLARE_TURN_TOKEN_ID: '',
      WEBRTC_CLOUDFLARE_TURN_API_TOKEN: '',
    });
    expect(await service.getIceServers()).toEqual([
      { urls: DEFAULT_STUN_URLS },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should use static TURN credentials when configured', async () => {
    const service = makeService({
      WEBRTC_STUN_URLS: 'stun:a:3478, stun:b:3478',
      WEBRTC_TURN_URLS: 'turn:t:3478,turns:t:5349',
      WEBRTC_TURN_USERNAME: 'user',
      WEBRTC_TURN_CREDENTIAL: 'pass',
      ...CLOUDFLARE_ENV,
    });
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(await service.getIceServers()).toEqual([
      { urls: ['stun:a:3478', 'stun:b:3478'] },
      {
        urls: ['turn:t:3478', 'turns:t:5349'],
        username: 'user',
        credential: 'pass',
      },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should mint Cloudflare TURN credentials without port 53 URLs', async () => {
    const fetchSpy = mockCloudflareResponse();
    const service = makeService(CLOUDFLARE_ENV);
    expect(await service.getIceServers()).toEqual([
      { urls: DEFAULT_STUN_URLS },
      {
        urls: [
          'turn:turn.cloudflare.com:3478?transport=udp',
          'turns:turn.cloudflare.com:443?transport=tcp',
        ],
        username: 'user',
        credential: 'pass',
      },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://rtc.live.cloudflare.com/v1/turn/keys/token-id/credentials/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should cache minted credentials and share in-flight requests', async () => {
    const fetchSpy = mockCloudflareResponse();
    const service = makeService(CLOUDFLARE_ENV);
    await Promise.all([service.getIceServers(), service.getIceServers()]);
    await service.getIceServers();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should fall back to STUN-only when minting fails, and retry later', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('timeout'));
    const service = makeService(CLOUDFLARE_ENV);
    expect(await service.getIceServers()).toEqual([
      { urls: DEFAULT_STUN_URLS },
    ]);
    await service.getIceServers();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
