/** Ignores "not set" values: `0`, negative numbers, `NaN` and `undefined`. */
function asPositiveNumber(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

/**
 * Resolves the effective download speed limit in **bytes per second**.
 *
 * `clientKbps` is the value of the `X-Download-Speed-Limit` header, which the
 * clients send in KB/s. `serverBytesPerSecond` is the server-wide limit from
 * the configuration, which is already stored in bytes per second.
 *
 * The server value is a cap, so the lower of both wins. Clients that send no
 * limit (or `0`) still get throttled by the server limit. Returns `0` when no
 * limit applies at all.
 */
export function resolveDownloadSpeedLimit(
  clientKbps: number | undefined,
  serverBytesPerSecond: number | undefined,
): number {
  const client = asPositiveNumber(clientKbps);
  const server = asPositiveNumber(serverBytesPerSecond);
  const clientBytes = client === undefined ? undefined : client * 1024;

  if (clientBytes !== undefined && server !== undefined) {
    return Math.min(clientBytes, server);
  }
  return clientBytes ?? server ?? 0;
}
