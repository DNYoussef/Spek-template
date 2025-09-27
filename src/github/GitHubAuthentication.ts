/**
 * GitHub Authentication Manager
 * Handles token management, validation, and refresh
 */

import {
  GitHubAuthConfig,
  GitHubAuthType,
  GitHubTokenInfo
} from '../types/github-types';

export class GitHubAuthentication {
  private config: GitHubAuthConfig;
  private currentToken: string | null = null;
  private tokenInfo: GitHubTokenInfo | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: GitHubAuthConfig) {
    this.config = config;
    this.currentToken = this.loadToken();
  }

  /**
   * Load token from configuration
   */
  private loadToken(): string | null {
    switch (this.config.type) {
      case 'token':
        return this.config.token || null;
      case 'app':
        // For GitHub Apps, we'd generate JWTs and get installation tokens
        return this.generateAppToken();
      case 'oauth':
        return this.config.accessToken || null;
      default:
        return null;
    }
  }

  /**
   * Generate GitHub App token (JWT)
   */
  private generateAppToken(): string | null {
    if (!this.config.appId || !this.config.privateKey) {
      throw new Error('GitHub App configuration incomplete');
    }

    try {
      // This would use jsonwebtoken library in real implementation
      const jwt = require('jsonwebtoken');

      const payload = {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes
        iss: this.config.appId
      };

      return jwt.sign(payload, this.config.privateKey, { algorithm: 'RS256' });
    } catch (error) {
      console.error('Failed to generate GitHub App token:', error);
      return null;
    }
  }

  /**
   * Get installation token for GitHub App
   */
  private async getInstallationToken(): Promise<string> {
    if (!this.config.installationId) {
      throw new Error('Installation ID required for GitHub App');
    }

    const appToken = this.generateAppToken();
    if (!appToken) {
      throw new Error('Failed to generate app token');
    }

    try {
      const response = await fetch(
        `https://api.github.com/app/installations/${this.config.installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${appToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get installation token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Failed to get installation token:', error);
      throw error;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string {
    if (!this.currentToken) {
      throw new Error('No authentication token available');
    }
    return this.currentToken;
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();

      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.tokenInfo = {
          login: userData.login,
          id: userData.id,
          type: userData.type,
          scopes: this.parseScopes(response.headers.get('x-oauth-scopes')),
          expiresAt: this.parseTokenExpiry(response.headers)
        };

        console.log(`Authenticated as: ${this.tokenInfo.login} (${this.tokenInfo.type})`);

        // Set up token refresh if needed
        this.scheduleTokenRefresh();

        return true;
      } else if (response.status === 401) {
        console.error('GitHub token is invalid or expired');
        return false;
      } else {
        throw new Error(`Token validation failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      return false;
    }
  }

  /**
   * Parse token scopes from headers
   */
  private parseScopes(scopeHeader: string | null): string[] {
    if (!scopeHeader) return [];
    return scopeHeader.split(',').map(scope => scope.trim());
  }

  /**
   * Parse token expiry from headers
   */
  private parseTokenExpiry(headers: Headers): Date | null {
    // GitHub Apps tokens expire, personal tokens don't
    if (this.config.type === 'app') {
      // Installation tokens expire after 1 hour
      return new Date(Date.now() + (60 * 60 * 1000));
    }
    return null;
  }

  /**
   * Schedule token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (this.tokenInfo?.expiresAt && this.config.type === 'app') {
      const refreshTime = this.tokenInfo.expiresAt.getTime() - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(async () => {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('Automatic token refresh failed:', error);
          }
        }, refreshTime);
      }
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'app':
          this.currentToken = await this.getInstallationToken();
          break;
        case 'oauth':
          this.currentToken = await this.refreshOAuthToken();
          break;
        case 'token':
          // Personal access tokens don't refresh
          throw new Error('Personal access tokens cannot be refreshed');
        default:
          throw new Error('Unknown authentication type');
      }

      // Validate the new token
      await this.validateToken();

      console.log('GitHub token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh GitHub token:', error);
      throw error;
    }
  }

  /**
   * Refresh OAuth token
   */
  private async refreshOAuthToken(): Promise<string> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('OAuth refresh configuration incomplete');
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`OAuth refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`OAuth refresh error: ${data.error_description}`);
      }

      // Update refresh token if provided
      if (data.refresh_token) {
        this.config.refreshToken = data.refresh_token;
      }

      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh OAuth token:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  getTokenInfo(): GitHubTokenInfo | null {
    return this.tokenInfo;
  }

  /**
   * Check if token has specific scope
   */
  hasScope(scope: string): boolean {
    return this.tokenInfo?.scopes.includes(scope) || false;
  }

  /**
   * Check required scopes
   */
  checkRequiredScopes(requiredScopes: string[]): { valid: boolean; missing: string[] } {
    if (!this.tokenInfo) {
      return { valid: false, missing: requiredScopes };
    }

    const missing = requiredScopes.filter(scope => !this.hasScope(scope));
    return { valid: missing.length === 0, missing };
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if (this.config.userAgent) {
      headers['User-Agent'] = this.config.userAgent;
    }

    return headers;
  }

  /**
   * Cleanup authentication
   */
  cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.currentToken = null;
    this.tokenInfo = null;
  }

  /**
   * Create authentication for different scenarios
   */
  static createPersonalToken(token: string, userAgent?: string): GitHubAuthentication {
    return new GitHubAuthentication({
      type: 'token',
      token,
      userAgent
    });
  }

  static createGitHubApp(
    appId: string,
    privateKey: string,
    installationId: string,
    userAgent?: string
  ): GitHubAuthentication {
    return new GitHubAuthentication({
      type: 'app',
      appId,
      privateKey,
      installationId,
      userAgent
    });
  }

  static createOAuth(
    accessToken: string,
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    userAgent?: string
  ): GitHubAuthentication {
    return new GitHubAuthentication({
      type: 'oauth',
      accessToken,
      refreshToken,
      clientId,
      clientSecret,
      userAgent
    });
  }
}

export default GitHubAuthentication;