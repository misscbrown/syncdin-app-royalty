import { SpotifyApi } from "@spotify/web-api-ts-sdk";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Spotify connection not available');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);
  
  const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = connectionSettings.settings?.oauth?.credentials?.expires_in;
  
  if (!connectionSettings || (!accessToken || !clientId || !refreshToken)) {
    throw new Error('Spotify not connected');
  }
  return { accessToken, clientId, refreshToken, expiresIn };
}

export async function getSpotifyClient(): Promise<SpotifyApi> {
  const { accessToken, clientId, refreshToken, expiresIn } = await getAccessToken();

  const spotify = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });

  return spotify;
}

export interface SpotifyTrackMatch {
  spotifyId: string;
  spotifyUri: string;
  name: string;
  artists: string[];
  album: string;
  albumArt: string | null;
  previewUrl: string | null;
  popularity: number;
  durationMs: number;
  isrc: string | null;
}

export async function searchTrackByISRC(isrc: string): Promise<SpotifyTrackMatch | null> {
  try {
    const spotify = await getSpotifyClient();
    const results = await spotify.search(`isrc:${isrc}`, ['track'], undefined, 1);
    
    if (results.tracks.items.length === 0) {
      return null;
    }
    
    const track = results.tracks.items[0];
    return {
      spotifyId: track.id,
      spotifyUri: track.uri,
      name: track.name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      durationMs: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
    };
  } catch (error) {
    console.error(`Error searching for ISRC ${isrc}:`, error);
    return null;
  }
}

export async function searchTrackByNameArtist(title: string, artist: string): Promise<SpotifyTrackMatch | null> {
  try {
    const spotify = await getSpotifyClient();
    const query = `track:${title} artist:${artist}`;
    const results = await spotify.search(query, ['track'], undefined, 5);
    
    if (results.tracks.items.length === 0) {
      return null;
    }
    
    const track = results.tracks.items[0];
    return {
      spotifyId: track.id,
      spotifyUri: track.uri,
      name: track.name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      durationMs: track.duration_ms,
      isrc: track.external_ids?.isrc || null,
    };
  } catch (error) {
    console.error(`Error searching for "${title}" by "${artist}":`, error);
    return null;
  }
}

export async function matchTrack(isrc: string, title: string, artist: string): Promise<SpotifyTrackMatch | null> {
  let match = await searchTrackByISRC(isrc);
  
  if (!match && title && artist) {
    match = await searchTrackByNameArtist(title, artist);
  }
  
  return match;
}

export async function checkSpotifyConnection(): Promise<boolean> {
  try {
    const spotify = await getSpotifyClient();
    await spotify.currentUser.profile();
    return true;
  } catch (error) {
    return false;
  }
}
