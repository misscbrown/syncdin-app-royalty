import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Source type classification
export type YouTubeSourceType = "OFFICIAL_ARTIST_CHANNEL" | "LABEL_CHANNEL" | "TOPIC_VIDEO" | "OTHER";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface YouTubeTrackMatch {
  videoId: string;
  videoUrl: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  publishedAt: string;
  thumbnail: string | null;
  viewCount: number | null;
  duration: string | null;
  durationMs: number | null;
}

export interface ClassifiedYouTubeMatch extends YouTubeTrackMatch {
  sourceType: YouTubeSourceType;
  identityConfidence: ConfidenceLevel;
  performanceWeight: ConfidenceLevel;
  matchMethod: "isrc" | "title_artist_duration" | "title_artist_channel" | "fuzzy";
  matchConfidence: number;
}

export interface YouTubeMatchResult {
  match: YouTubeTrackMatch | null;
  confidence: number;
  matchMethod: "isrc" | "title_artist_duration" | "title_artist_channel" | "fuzzy" | null;
  matchSource: "youtube";
}

export interface YouTubeMultiMatchResult {
  matches: ClassifiedYouTubeMatch[];
  matchSource: "youtube";
}

function parseDuration(isoDuration: string): number | null {
  if (!isoDuration) return null;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateTitleSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  
  const words1 = s1.split(" ");
  const words2 = s2.split(" ");
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);
  
  return similarity;
}

function isOfficialChannel(channelTitle: string, artistName: string): boolean {
  const normalizedChannel = normalizeString(channelTitle);
  const normalizedArtist = normalizeString(artistName);
  
  if (normalizedChannel.includes(normalizedArtist)) return true;
  if (normalizedChannel.includes("vevo")) return true;
  if (normalizedChannel.includes("official")) return true;
  if (normalizedChannel.includes("records")) return true;
  if (normalizedChannel.includes("music")) return true;
  
  return false;
}

// Classification functions for YouTube source types
function classifySourceType(
  channelTitle: string,
  videoTitle: string,
  artistName: string
): YouTubeSourceType {
  const normalizedChannel = normalizeString(channelTitle);
  const normalizedVideoTitle = normalizeString(videoTitle);
  
  // Topic videos: YouTube auto-generated channels ending in " - Topic"
  if (channelTitle.endsWith(" - Topic")) {
    return "TOPIC_VIDEO";
  }
  
  // Official artist channel: VEVO, or channel name closely matches artist
  if (normalizedChannel.includes("vevo")) {
    return "OFFICIAL_ARTIST_CHANNEL";
  }
  
  const normalizedArtist = normalizeString(artistName);
  if (normalizedChannel === normalizedArtist || 
      normalizedChannel === `${normalizedArtist} official` ||
      normalizedChannel.includes(`${normalizedArtist} music`)) {
    return "OFFICIAL_ARTIST_CHANNEL";
  }
  
  // Label channels: Common record label keywords
  const labelKeywords = ["records", "recordings", "entertainment", "music group", "label", "warner", "sony", "universal", "emi", "atlantic", "capitol"];
  for (const keyword of labelKeywords) {
    if (normalizedChannel.includes(keyword)) {
      return "LABEL_CHANNEL";
    }
  }
  
  // Check if video title suggests official release
  if (normalizedVideoTitle.includes("official video") || 
      normalizedVideoTitle.includes("official audio") ||
      normalizedVideoTitle.includes("official music video")) {
    if (normalizedChannel.includes(normalizedArtist)) {
      return "OFFICIAL_ARTIST_CHANNEL";
    }
    return "LABEL_CHANNEL";
  }
  
  return "OTHER";
}

function calculateIdentityConfidence(
  sourceType: YouTubeSourceType,
  matchMethod: "isrc" | "title_artist_duration" | "title_artist_channel" | "fuzzy"
): ConfidenceLevel {
  // ISRC matches are always high confidence
  if (matchMethod === "isrc") return "HIGH";
  
  // Topic videos and label uploads are high confidence (official releases)
  if (sourceType === "TOPIC_VIDEO" || sourceType === "LABEL_CHANNEL") {
    return "HIGH";
  }
  
  // Official artist channel with good title match is medium-high
  if (sourceType === "OFFICIAL_ARTIST_CHANNEL") {
    return matchMethod === "fuzzy" ? "MEDIUM" : "HIGH";
  }
  
  // Duration-validated matches are medium confidence
  if (matchMethod === "title_artist_duration") return "MEDIUM";
  
  // Title+artist matches on non-official channels
  if (matchMethod === "title_artist_channel") return "MEDIUM";
  
  // Fuzzy matches are low confidence
  return "LOW";
}

function calculatePerformanceWeight(sourceType: YouTubeSourceType): ConfidenceLevel {
  // Official artist channel videos have highest performance relevance
  if (sourceType === "OFFICIAL_ARTIST_CHANNEL") return "HIGH";
  
  // Label channel uploads have medium performance relevance
  if (sourceType === "LABEL_CHANNEL") return "MEDIUM";
  
  // Topic videos (auto-generated) have lowest performance relevance
  if (sourceType === "TOPIC_VIDEO") return "LOW";
  
  return "LOW";
}

export async function searchYouTubeByISRC(isrc: string): Promise<YouTubeTrackMatch | null> {
  try {
    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: isrc,
      type: ["video"],
      maxResults: 3,
      order: "relevance",
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return null;
    }

    const videoIds = searchResponse.data.items
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) return null;

    const videoResponse = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    });

    if (!videoResponse.data.items) return null;

    for (const video of videoResponse.data.items) {
      const description = (video.snippet?.description || "").toUpperCase();
      if (description.includes(isrc.toUpperCase())) {
        const durationMs = video.contentDetails?.duration
          ? parseDuration(video.contentDetails.duration)
          : null;

        return {
          videoId: video.id!,
          videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
          title: video.snippet?.title || "",
          channelTitle: video.snippet?.channelTitle || "",
          channelId: video.snippet?.channelId || "",
          description: video.snippet?.description || "",
          publishedAt: video.snippet?.publishedAt || "",
          thumbnail: video.snippet?.thumbnails?.high?.url || 
                     video.snippet?.thumbnails?.default?.url || null,
          viewCount: video.statistics?.viewCount 
            ? parseInt(video.statistics.viewCount, 10) 
            : null,
          duration: video.contentDetails?.duration || null,
          durationMs,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`YouTube ISRC search error for "${isrc}":`, error);
    return null;
  }
}

export async function searchYouTubeByQuery(
  title: string,
  artist: string,
  maxResults: number = 5
): Promise<YouTubeTrackMatch[]> {
  try {
    const query = `${title} ${artist} official`;
    
    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      q: query,
      type: ["video"],
      maxResults,
      order: "relevance",
      videoCategoryId: "10", // Music category
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return [];
    }

    const videoIds = searchResponse.data.items
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) return [];

    const videoResponse = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    });

    if (!videoResponse.data.items) return [];

    return videoResponse.data.items.map((video) => {
      const durationMs = video.contentDetails?.duration
        ? parseDuration(video.contentDetails.duration)
        : null;

      return {
        videoId: video.id!,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        title: video.snippet?.title || "",
        channelTitle: video.snippet?.channelTitle || "",
        channelId: video.snippet?.channelId || "",
        description: video.snippet?.description || "",
        publishedAt: video.snippet?.publishedAt || "",
        thumbnail: video.snippet?.thumbnails?.high?.url || 
                   video.snippet?.thumbnails?.default?.url || null,
        viewCount: video.statistics?.viewCount 
          ? parseInt(video.statistics.viewCount, 10) 
          : null,
        duration: video.contentDetails?.duration || null,
        durationMs,
      };
    });
  } catch (error) {
    console.error(`YouTube search error for "${title}" by "${artist}":`, error);
    return [];
  }
}

export async function matchTrackOnYouTube(
  title: string,
  artist: string,
  isrc?: string | null,
  spotifyDurationMs?: number | null
): Promise<YouTubeMatchResult> {
  // Priority 1: ISRC match (100% confidence)
  if (isrc) {
    const isrcMatch = await searchYouTubeByISRC(isrc);
    if (isrcMatch) {
      return {
        match: isrcMatch,
        confidence: 100,
        matchMethod: "isrc",
        matchSource: "youtube",
      };
    }
  }

  // Priority 2-4: Title/artist search with confidence ladder
  const results = await searchYouTubeByQuery(title, artist, 5);

  if (results.length === 0) {
    return { match: null, confidence: 0, matchMethod: null, matchSource: "youtube" };
  }

  for (const video of results) {
    const titleSimilarity = calculateTitleSimilarity(video.title, title);
    const hasArtistInChannel = isOfficialChannel(video.channelTitle, artist);
    const hasArtistInTitle = normalizeString(video.title).includes(normalizeString(artist));

    // Priority 2: Duration match with Spotify cross-reference (90%)
    if (spotifyDurationMs && video.durationMs) {
      const durationDiff = Math.abs(spotifyDurationMs - video.durationMs);
      const durationTolerance = 5000; // 5 seconds tolerance
      
      if (durationDiff <= durationTolerance && titleSimilarity > 0.7) {
        return {
          match: video,
          confidence: 90,
          matchMethod: "title_artist_duration",
          matchSource: "youtube",
        };
      }
    }

    // Priority 3: Official channel verification (85%) or artist in title (75%)
    if (titleSimilarity > 0.8 && (hasArtistInChannel || hasArtistInTitle)) {
      const confidence = hasArtistInChannel ? 85 : 75;
      return {
        match: video,
        confidence,
        matchMethod: "title_artist_channel",
        matchSource: "youtube",
      };
    }
  }

  // Priority 4: Fuzzy match (flagged for review, <60%)
  const bestMatch = results[0];
  const titleSimilarity = calculateTitleSimilarity(bestMatch.title, title);
  
  if (titleSimilarity > 0.5) {
    return {
      match: bestMatch,
      confidence: Math.round(titleSimilarity * 60),
      matchMethod: "fuzzy",
      matchSource: "youtube",
    };
  }

  return { match: null, confidence: 0, matchMethod: null, matchSource: "youtube" };
}

export async function checkYouTubeConnection(): Promise<boolean> {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return false;
    }
    
    const response = await youtube.search.list({
      part: ["snippet"],
      q: "test",
      maxResults: 1,
    });
    
    return response.status === 200;
  } catch (error) {
    console.error("YouTube connection check failed:", error);
    return false;
  }
}

// New multi-match function that returns all valid matches with classification
export async function matchTrackOnYouTubeMulti(
  title: string,
  artist: string,
  isrc?: string | null,
  spotifyDurationMs?: number | null
): Promise<YouTubeMultiMatchResult> {
  const classifiedMatches: ClassifiedYouTubeMatch[] = [];
  
  // Priority 1: ISRC match (100% confidence)
  if (isrc) {
    const isrcMatch = await searchYouTubeByISRC(isrc);
    if (isrcMatch) {
      const sourceType = classifySourceType(isrcMatch.channelTitle, isrcMatch.title, artist);
      classifiedMatches.push({
        ...isrcMatch,
        sourceType,
        identityConfidence: calculateIdentityConfidence(sourceType, "isrc"),
        performanceWeight: calculatePerformanceWeight(sourceType),
        matchMethod: "isrc",
        matchConfidence: 100,
      });
    }
  }

  // Search for additional matches by title/artist
  const results = await searchYouTubeByQuery(title, artist, 8);

  for (const video of results) {
    // Skip if already matched by ISRC
    if (classifiedMatches.some(m => m.videoId === video.videoId)) continue;
    
    const titleSimilarity = calculateTitleSimilarity(video.title, title);
    const hasArtistInChannel = isOfficialChannel(video.channelTitle, artist);
    const hasArtistInTitle = normalizeString(video.title).includes(normalizeString(artist));
    const sourceType = classifySourceType(video.channelTitle, video.title, artist);
    
    let matchMethod: "title_artist_duration" | "title_artist_channel" | "fuzzy" | null = null;
    let confidence = 0;

    // Priority 2: Duration match with Spotify cross-reference (90%)
    if (spotifyDurationMs && video.durationMs) {
      const durationDiff = Math.abs(spotifyDurationMs - video.durationMs);
      const durationTolerance = 5000; // 5 seconds tolerance
      
      if (durationDiff <= durationTolerance && titleSimilarity > 0.7) {
        matchMethod = "title_artist_duration";
        confidence = 90;
      }
    }

    // Priority 3: Official channel verification (85%) or artist in title (75%)
    if (!matchMethod && titleSimilarity > 0.8 && (hasArtistInChannel || hasArtistInTitle)) {
      matchMethod = "title_artist_channel";
      confidence = hasArtistInChannel ? 85 : 75;
    }

    // Priority 4: Fuzzy match (flagged for review, <60%)
    if (!matchMethod && titleSimilarity > 0.5) {
      matchMethod = "fuzzy";
      confidence = Math.round(titleSimilarity * 60);
    }

    if (matchMethod && confidence > 0) {
      classifiedMatches.push({
        ...video,
        sourceType,
        identityConfidence: calculateIdentityConfidence(sourceType, matchMethod),
        performanceWeight: calculatePerformanceWeight(sourceType),
        matchMethod,
        matchConfidence: confidence,
      });
    }
  }

  // Sort by: identity confidence (HIGH first), then by match confidence
  const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  classifiedMatches.sort((a, b) => {
    const confDiff = confidenceOrder[b.identityConfidence] - confidenceOrder[a.identityConfidence];
    if (confDiff !== 0) return confDiff;
    return b.matchConfidence - a.matchConfidence;
  });

  return { matches: classifiedMatches, matchSource: "youtube" };
}

export async function getVideoDetails(videoId: string): Promise<YouTubeTrackMatch | null> {
  try {
    const response = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const video = response.data.items[0];
    const durationMs = video.contentDetails?.duration
      ? parseDuration(video.contentDetails.duration)
      : null;

    return {
      videoId: video.id!,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.snippet?.title || "",
      channelTitle: video.snippet?.channelTitle || "",
      channelId: video.snippet?.channelId || "",
      description: video.snippet?.description || "",
      publishedAt: video.snippet?.publishedAt || "",
      thumbnail: video.snippet?.thumbnails?.high?.url || 
                 video.snippet?.thumbnails?.default?.url || null,
      viewCount: video.statistics?.viewCount 
        ? parseInt(video.statistics.viewCount, 10) 
        : null,
      duration: video.contentDetails?.duration || null,
      durationMs,
    };
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error);
    return null;
  }
}
