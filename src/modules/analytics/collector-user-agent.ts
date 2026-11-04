import { arch, platform } from "node:os";

/**
 * User agent the server reports with, in the same shape the desktop client
 * uses (`gamevault-frontend/src-tauri/src/user_agent.rs`), for example
 * `GameVault/1.17.1.0 (X11; Linux x86_64)`.
 *
 * Two constraints meet here:
 * - Swetrix's bot protection drops every request whose user agent `isbot`
 *   classifies as automated, and a bare product token is one of them. The
 *   parenthesised platform token is what makes the request read as a browser.
 * - The `1.` prefix separates the server from the desktop client, which
 *   reports `GameVault/2.<version>`.
 */
export function collectorUserAgent(serverVersion: string): string {
  return `GameVault/1.${serverVersion} (${platformToken()})`;
}

/** Platform token of the running system. */
export function platformToken(): string {
  return platformTokenFor(platform(), arch());
}

/**
 * Platform token for a given OS and architecture.
 *
 * The tokens are the ones browsers put in their own user agent, because the
 * parsers behind analytics dashboards and server logs are written against
 * them.
 */
export function platformTokenFor(
  os: NodeJS.Platform,
  architecture: string,
): string {
  switch (os) {
    case "win32":
      return `Windows NT 10.0; ${windowsArchitecture(architecture)}`;
    case "darwin":
      // Browsers froze this string, so Apple Silicon reports the same token as
      // Intel.
      return "Macintosh; Intel Mac OS X 10_15_7";
    case "linux":
      return `X11; Linux ${linuxArchitecture(architecture)}`;
    default:
      return os;
  }
}

function windowsArchitecture(architecture: string): string {
  switch (architecture) {
    case "x64":
      return "Win64; x64";
    case "arm64":
      return "ARM64";
    case "ia32":
      return "Win32";
    default:
      return architecture;
  }
}

function linuxArchitecture(architecture: string): string {
  switch (architecture) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "aarch64";
    case "arm":
      return "armv7l";
    case "ia32":
      return "i686";
    default:
      return architecture;
  }
}
