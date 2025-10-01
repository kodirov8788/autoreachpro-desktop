import * as crypto from "crypto";

export interface SessionToken {
  token: string;
  expiresAt: Date;
  origin: string;
  desktopAppId: string;
}

export class SecurityManager {
  private readonly ALLOWED_ORIGINS = [
    "https://autoreachpro.com",
    "https://www.autoreachpro.com",
    "https://autoreach-pro.vercel.app",
    "http://localhost:3000", // For development
    "http://127.0.0.1:3000", // For development
  ];

  private activeTokens: Map<string, SessionToken> = new Map();
  private pairingCodes: Map<string, { expiresAt: Date; origin: string }> =
    new Map();

  constructor() {
    // Clean up expired tokens every 5 minutes
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
  }

  validateOrigin(origin: string): boolean {
    return this.ALLOWED_ORIGINS.includes(origin);
  }

  generatePairingCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.pairingCodes.set(code, {
      expiresAt,
      origin: "any", // Will be set when validated
    });

    console.log(`🔐 Generated pairing code: ${code} (expires in 10 minutes)`);
    return code;
  }

  validatePairingCode(code: string, origin: string): boolean {
    const pairingData = this.pairingCodes.get(code);

    if (!pairingData) {
      console.warn(`❌ Invalid pairing code: ${code}`);
      return false;
    }

    if (new Date() > pairingData.expiresAt) {
      console.warn(`❌ Expired pairing code: ${code}`);
      this.pairingCodes.delete(code);
      return false;
    }

    // Update origin for this code
    pairingData.origin = origin;
    console.log(`✅ Valid pairing code: ${code} for origin: ${origin}`);
    return true;
  }

  generateSessionToken(origin: string): SessionToken {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const desktopAppId = crypto.randomBytes(16).toString("hex");

    const sessionToken: SessionToken = {
      token,
      expiresAt,
      origin,
      desktopAppId,
    };

    this.activeTokens.set(token, sessionToken);
    console.log(
      `🎫 Generated session token for origin: ${origin} (expires in 5 minutes)`
    );

    return sessionToken;
  }

  validateToken(token: string, origin: string): boolean {
    const sessionToken = this.activeTokens.get(token);

    if (!sessionToken) {
      console.warn(`❌ Invalid session token`);
      return false;
    }

    if (new Date() > sessionToken.expiresAt) {
      console.warn(`❌ Expired session token`);
      this.activeTokens.delete(token);
      return false;
    }

    if (sessionToken.origin !== origin) {
      console.warn(
        `❌ Token origin mismatch: expected ${sessionToken.origin}, got ${origin}`
      );
      return false;
    }

    console.log(`✅ Valid session token for origin: ${origin}`);
    return true;
  }

  revokeToken(token: string): boolean {
    const deleted = this.activeTokens.delete(token);
    if (deleted) {
      console.log(`🗑️ Revoked session token`);
    }
    return deleted;
  }

  revokePairingCode(code: string): boolean {
    const deleted = this.pairingCodes.delete(code);
    if (deleted) {
      console.log(`🗑️ Revoked pairing code: ${code}`);
    }
    return deleted;
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    let cleanedCount = 0;

    // Clean up expired session tokens
    for (const [token, sessionToken] of this.activeTokens) {
      if (now > sessionToken.expiresAt) {
        this.activeTokens.delete(token);
        cleanedCount++;
      }
    }

    // Clean up expired pairing codes
    for (const [code, pairingData] of this.pairingCodes) {
      if (now > pairingData.expiresAt) {
        this.pairingCodes.delete(code);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired tokens/codes`);
    }
  }

  getActiveTokenCount(): number {
    return this.activeTokens.size;
  }

  getActivePairingCodeCount(): number {
    return this.pairingCodes.size;
  }

  getAllowedOrigins(): string[] {
    return [...this.ALLOWED_ORIGINS];
  }
}
