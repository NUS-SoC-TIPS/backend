// Defaults for the WebRTC (peer-to-peer video) configuration.
//
// STUN servers are free and effectively unlimited; they let peers discover
// their externally reachable addresses. TURN servers relay media for the
// minority of calls whose NAT/firewall setup blocks a direct connection
// (~10-20% of calls in practice) and are configured via environment
// variables (see WebrtcService) rather than hardcoded here.

export const DEFAULT_STUN_URLS: string[] = [
  'stun:stun.cloudflare.com:3478',
  'stun:stun.l.google.com:19302',
];

// How long (in seconds) minted Cloudflare TURN credentials stay valid.
export const CLOUDFLARE_TURN_CREDENTIAL_TTL_SECONDS = 86400;

export const CLOUDFLARE_TURN_CREDENTIALS_URL =
  'https://rtc.live.cloudflare.com/v1/turn/keys';

// Upper bound on how long a room join waits for Cloudflare to mint TURN
// credentials before falling back to STUN-only.
export const CLOUDFLARE_TURN_REQUEST_TIMEOUT_MS = 3000;
