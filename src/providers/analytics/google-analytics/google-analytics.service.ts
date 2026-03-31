import {
  IAnalyticsGateway,
  IdentifyUserData,
  PageViewData,
  TrackEventData,
} from '../index';
import { GoogleAnalyticsConfig } from './google-analytics.types';

export class GoogleAnalyticsService implements IAnalyticsGateway {
  private config: GoogleAnalyticsConfig;

  constructor(config: GoogleAnalyticsConfig) {
    this.config = config;
  }

  public async trackEvent(data: TrackEventData): Promise<void> {
    const { eventName, properties, userId } = data;
    console.log(
      `📊 [GA4] Tracking Event: ${eventName} (ID: ${this.config.measurementId})${userId ? ` - User: ${userId}` : ''}`,
      properties,
    );
    // Real implementation with HTTP POST using this.config.apiSecret
  }

  public async identifyUser(data: IdentifyUserData): Promise<void> {
    const { userId, traits } = data;
    console.log(`📊 [GA4] Identifying User: ${userId}`, traits);
    // Identification logic
  }

  public async pageView(data: PageViewData): Promise<void> {
    const { pageName, properties } = data;
    console.log(`📊 [GA4] Tracking Page View: ${pageName}`, properties);
    // Page view tracking logic
  }
}
