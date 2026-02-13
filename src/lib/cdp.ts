import { CdpClient } from "@coinbase/cdp-sdk";

let _cdp: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (!_cdp) {
    _cdp = new CdpClient();
  }
  return _cdp;
}
