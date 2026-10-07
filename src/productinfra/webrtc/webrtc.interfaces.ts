// Shape of a single entry in the RTCIceServer list sent to clients.
// Mirrors the browser's RTCIceServer type so the frontend can pass the
// payload straight into RTCPeerConnection's configuration.
export interface RTCIceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}
