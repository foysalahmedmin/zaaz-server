import { GoogleAnalyticsService } from './google-analytics/google-analytics.service';

export interface TrackEventData {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
}

export interface IdentifyUserData {
  userId: string;
  traits?: Record<string, any>;
}

export interface PageViewData {
  pageName: string;
  properties?: Record<string, any>;
}

export interface IAnalyticsGateway {
  trackEvent(data: TrackEventData): Promise<void>;
  identifyUser(data: IdentifyUserData): Promise<void>;
  pageView(data: PageViewData): Promise<void>;
}

/**
 * AnalyticsManager handles broadcasting events to multiple providers
 * following the modular integration pattern.
 */
export class AnalyticsManager {
  private static providers: IAnalyticsGateway[] = [];

  public static addProvider(provider: IAnalyticsGateway): void {
    this.providers.push(provider);
  }

  public static async trackEvent(data: TrackEventData): Promise<void> {
    await Promise.all(
      this.providers.map((p) =>
        p.trackEvent(data).catch((err) => {
          console.error(`[Analytics] Failed to track event '${data.eventName}':`, err);
        }),
      ),
    );
  }

  public static async identifyUser(data: IdentifyUserData): Promise<void> {
    await Promise.all(
      this.providers.map((p) =>
        p.identifyUser(data).catch((err) => {
          console.error(`[Analytics] Failed to identify user '${data.userId}':`, err);
        }),
      ),
    );
  }

  public static async pageView(data: PageViewData): Promise<void> {
    await Promise.all(
      this.providers.map((p) =>
        p.pageView(data).catch((err) => {
          console.error(`[Analytics] Failed to track page view '${data.pageName}':`, err);
        }),
      ),
    );
  }
}

// Export implementations to match payment-gateways pattern
export { GoogleAnalyticsService };
