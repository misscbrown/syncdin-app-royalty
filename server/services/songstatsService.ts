import { storage } from "../storage";
import type { InsertSocialMetrics } from "@shared/schema";

const SONGSTATS_API_KEY = process.env.SONGSTATS_API_KEY;
const SONGSTATS_BASE_URL = "https://api.songstats.com/enterprise/v1";
const MONTHLY_LIMIT = 50;

interface SongstatsTrackInfo {
  isrc?: string;
  title?: string;
  artist?: string;
  songstats_track_id?: string;
}

interface SongstatsPlatformData {
  source: string;
  data: {
    plays_total?: number;
    views_total?: number;
    videos_total?: number;
    creator_reach_total?: number;
    followers_current?: number;
    reposts_total?: number;
  };
}

interface SongstatsTrackStatsResponse {
  stats?: SongstatsPlatformData[];
  track_info?: SongstatsTrackInfo;
  error?: string;
}

export class SongstatsService {
  private apiKey: string;

  constructor() {
    this.apiKey = SONGSTATS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("SONGSTATS_API_KEY not configured - Songstats integration will be disabled");
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async checkQuota(): Promise<{ remaining: number; limitReached: boolean }> {
    const remaining = await storage.getRemainingQuota();
    return {
      remaining,
      limitReached: remaining <= 0,
    };
  }

  async fetchTrackStats(isrc: string, title: string, artist: string, trackId: string): Promise<InsertSocialMetrics | null> {
    if (!this.isConfigured()) {
      console.error("Songstats API key not configured");
      return null;
    }

    const quota = await this.checkQuota();
    if (quota.limitReached) {
      console.warn("Monthly Songstats API quota reached");
      return null;
    }

    try {
      const url = new URL(`${SONGSTATS_BASE_URL}/tracks/stats`);
      url.searchParams.append("isrc", isrc);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "apikey": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Songstats API rate limited, please try again later");
          return null;
        }
        if (response.status === 404) {
          console.log(`Track not found in Songstats: ${isrc}`);
          await storage.incrementUsage();
          return this.createEmptyMetrics(trackId, isrc, title, artist);
        }
        console.error(`Songstats API error: ${response.status} ${response.statusText}`);
        return null;
      }

      await storage.incrementUsage();

      const data: SongstatsTrackStatsResponse = await response.json();
      
      if (data.error) {
        console.error(`Songstats API error: ${data.error}`);
        return this.createEmptyMetrics(trackId, isrc, title, artist);
      }

      return this.parseStatsResponse(data, trackId, isrc, title, artist);
    } catch (error) {
      console.error("Songstats API request failed:", error);
      return null;
    }
  }

  private parseStatsResponse(
    data: SongstatsTrackStatsResponse, 
    trackId: string, 
    isrc: string, 
    title: string, 
    artist: string
  ): InsertSocialMetrics {
    const stats = data.stats || [];
    
    let tiktokPlays = 0;
    let tiktokVideos = 0;
    let soundcloudPlays = 0;
    let instagramReels = 0;
    let snapchatPlays = 0;

    for (const platform of stats) {
      switch (platform.source) {
        case "tiktok":
          tiktokPlays = platform.data.views_total || platform.data.creator_reach_total || 0;
          tiktokVideos = platform.data.videos_total || 0;
          break;
        case "soundcloud":
          soundcloudPlays = platform.data.plays_total || 0;
          break;
        case "instagram":
          instagramReels = platform.data.creator_reach_total || 0;
          break;
        case "snapchat":
          snapchatPlays = platform.data.views_total || platform.data.plays_total || 0;
          break;
      }
    }

    const totalSocialPlays = tiktokPlays + soundcloudPlays + instagramReels + snapchatPlays;
    
    const platformCounts = [
      { name: "tiktok", count: tiktokPlays },
      { name: "soundcloud", count: soundcloudPlays },
      { name: "instagram", count: instagramReels },
      { name: "snapchat", count: snapchatPlays },
    ];
    const topPlatform = platformCounts.sort((a, b) => b.count - a.count)[0];

    return {
      trackId,
      isrc,
      title,
      artist,
      tiktokPlays,
      tiktokVideos,
      soundcloudPlays,
      instagramReels,
      snapchatPlays,
      totalSocialPlays,
      topPlatform: topPlatform.count > 0 ? topPlatform.name : null,
      rawResponse: data as unknown as Record<string, unknown>,
      lastUpdated: new Date(),
    };
  }

  private createEmptyMetrics(trackId: string, isrc: string, title: string, artist: string): InsertSocialMetrics {
    return {
      trackId,
      isrc,
      title,
      artist,
      tiktokPlays: 0,
      tiktokVideos: 0,
      soundcloudPlays: 0,
      instagramReels: 0,
      snapchatPlays: 0,
      totalSocialPlays: 0,
      topPlatform: null,
      rawResponse: null,
      lastUpdated: new Date(),
    };
  }

  async refreshTrackMetrics(trackId: string): Promise<InsertSocialMetrics | null> {
    const track = await storage.getTrack(trackId);
    if (!track) {
      console.error(`Track not found: ${trackId}`);
      return null;
    }

    const metrics = await this.fetchTrackStats(track.isrc, track.title, track.artist, trackId);
    if (metrics) {
      await storage.upsertSocialMetrics(metrics);
    }
    return metrics;
  }

  async refreshBatchMetrics(trackIds: string[]): Promise<{ 
    processed: number; 
    failed: number; 
    quotaReached: boolean;
    remaining: number;
  }> {
    let processed = 0;
    let failed = 0;
    let quotaReached = false;

    for (const trackId of trackIds) {
      const quota = await this.checkQuota();
      if (quota.limitReached) {
        quotaReached = true;
        break;
      }

      const result = await this.refreshTrackMetrics(trackId);
      if (result) {
        processed++;
      } else {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const remaining = await storage.getRemainingQuota();
    return { processed, failed, quotaReached, remaining };
  }

  async getSummary(): Promise<{
    totalSocialPlays: number;
    topPlatform: string;
    activeTracksCount: number;
    platformBreakdown: {
      tiktok: number;
      soundcloud: number;
      instagram: number;
      snapchat: number;
    };
    remainingQuota: number;
    limitReached: boolean;
  }> {
    const allMetrics = await storage.getAllSocialMetrics();
    const remainingQuota = await storage.getRemainingQuota();

    const platformBreakdown = {
      tiktok: 0,
      soundcloud: 0,
      instagram: 0,
      snapchat: 0,
    };

    let totalSocialPlays = 0;
    let activeTracksCount = 0;

    for (const m of allMetrics) {
      platformBreakdown.tiktok += m.tiktokPlays || 0;
      platformBreakdown.soundcloud += m.soundcloudPlays || 0;
      platformBreakdown.instagram += m.instagramReels || 0;
      platformBreakdown.snapchat += m.snapchatPlays || 0;
      totalSocialPlays += m.totalSocialPlays || 0;
      if ((m.totalSocialPlays || 0) > 0) {
        activeTracksCount++;
      }
    }

    const platforms = Object.entries(platformBreakdown).sort(([, a], [, b]) => b - a);
    const topPlatform = platforms[0][1] > 0 ? platforms[0][0] : "none";

    return {
      totalSocialPlays,
      topPlatform,
      activeTracksCount,
      platformBreakdown,
      remainingQuota,
      limitReached: remainingQuota <= 0,
    };
  }
}

export const songstatsService = new SongstatsService();
