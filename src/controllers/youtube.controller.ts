import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

// Helper to decode HTML entities in XML feed titles
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Extract channel ID from channel URL or handle page
async function getChannelIdFromUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();

  // 1. Direct channel link (e.g. /channel/UC...)
  const channelMatch = trimmed.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelMatch && channelMatch[1]) {
    return channelMatch[1];
  }

  // 2. Fetch page for user handles (/@...) or legacy user/custom aliases
  try {
    const response = await fetch(trimmed, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Look for <meta itemprop="channelId" content="UC...">
    const metaMatch = html.match(/itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/);
    if (metaMatch && metaMatch[1]) {
      return metaMatch[1];
    }

    // Fallback: search for "channelId":"UC..."
    const jsonMatch = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }

    // Fallback: search for itemprop="identifier" content="UC..."
    const identMatch = html.match(/itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{22})"/);
    if (identMatch && identMatch[1]) {
      return identMatch[1];
    }
  } catch (error) {
    console.error("Error fetching channel page to resolve ID:", error);
  }

  return null;
}

// Extract individual video ID from standard YouTube URL
function extractVideoId(url: string): string | null {
  const val = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = val.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  const shortsRegExp = /\/shorts\/([a-zA-Z0-9_-]{11})/;
  const shortsMatch = val.match(shortsRegExp);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  if (val.length === 11) {
    return val;
  }
  return null;
}

// Regex-based YouTube RSS XML parser
function parseYoutubeFeed(xml: string) {
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const videos: any[] = [];
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryContent = match[1];

    const videoIdMatch = entryContent.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) ||
                       entryContent.match(/<id>yt:video:([^<]+)<\/id>/);
    const titleMatch = entryContent.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entryContent.match(/<published>([^<]+)<\/published>/);
    const thumbnailMatch = entryContent.match(/<media:thumbnail\s+url="([^"]+)"/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1].trim();
      const title = titleMatch ? titleMatch[1].trim() : "Untitled Video";
      const published = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
      const thumbnail = thumbnailMatch ? thumbnailMatch[1].trim() : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      videos.push({
        videoId,
        title: decodeHtmlEntities(title),
        published,
        thumbnail,
      });
    }
  }

  return videos;
}

// Robust ytInitialData JSON extractor with brace counting
function extractInitialData(html: string): any {
  const marker = "var ytInitialData = ";
  const index = html.indexOf(marker);
  if (index === -1) return null;

  const start = index + marker.length;
  let braceCount = 0;
  let inString = false;
  let stringChar = "";
  let end = start;

  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (char === "\\") {
        i++;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }
    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end > start) {
    try {
      return JSON.parse(html.substring(start, end));
    } catch (e) {
      return null;
    }
  }
  return null;
}

function findLockupViewModels(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== "object") return results;

  if (obj.lockupViewModel) {
    results.push(obj.lockupViewModel);
  }

  for (const key of Object.keys(obj)) {
    findLockupViewModels(obj[key], results);
  }

  return results;
}

function findVideoRenderers(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== "object") return results;

  if (obj.videoRenderer) {
    results.push(obj.videoRenderer);
  }

  for (const key of Object.keys(obj)) {
    findVideoRenderers(obj[key], results);
  }

  return results;
}

async function fetchVideosFromChannelPage(channelUrl: string): Promise<any[] | null> {
  try {
    let targetUrl = channelUrl.trim();
    if (
      (targetUrl.includes("/@") || targetUrl.includes("/channel/") || targetUrl.includes("/c/") || targetUrl.includes("/user/")) &&
      !targetUrl.includes("/videos") &&
      !targetUrl.includes("/featured") &&
      !targetUrl.includes("/playlists") &&
      !targetUrl.includes("/shorts") &&
      !targetUrl.includes("/streams")
    ) {
      targetUrl = targetUrl.replace(/\/$/, "") + "/videos";
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) return null;
    const html = await response.text();

    const data = extractInitialData(html);
    if (!data) return null;

    const lockupVms = findLockupViewModels(data);
    if (lockupVms.length > 0) {
      return lockupVms.map((vm: any) => {
        const videoId = vm.contentId;
        const title = vm.metadata?.lockupMetadataViewModel?.title?.content || "Untitled Video";
        let published = "Recently";
        const metadataParts = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts;
        if (metadataParts && metadataParts.length > 1) {
          published = metadataParts[1].text?.content || published;
        }
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        return {
          videoId,
          title,
          published,
          thumbnail,
        };
      });
    }

    const videoRenderers = findVideoRenderers(data);
    if (videoRenderers.length > 0) {
      return videoRenderers.map((vr: any) => {
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "Untitled Video";
        const published = vr.publishedTimeText?.simpleText || "Recently";
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        return {
          videoId,
          title,
          published,
          thumbnail,
        };
      });
    }
  } catch (error) {
    console.error("Error scraping channel page for videos:", error);
  }

  return null;
}

export const getYoutubeVideos = async (req: Request, res: Response) => {
  try {
    // 1. Fetch land-youtube configuration
    const setting = await prisma.pageSetting.findUnique({
      where: { key: "land-youtube" },
    });

    if (!setting || !setting.value) {
      return res.status(200).json(ApiResponse.success([], "No YouTube setting configured"));
    }

    const value = setting.value.trim();

    // 2. Check if this is a manual list of video links (comma/space-separated)
    if (value.includes(",") || (!value.includes("channel") && !value.includes("/@") && !value.includes("/c/") && !value.includes("/user/") && extractVideoId(value))) {
      const urls = value.split(/[\s,]+/);
      const videoIds = urls.map(extractVideoId).filter(Boolean) as string[];

      if (videoIds.length > 0) {
        const manualVideos = videoIds.map((id) => ({
          videoId: id,
          title: "Video Kegiatan",
          published: new Date().toISOString(),
          thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        }));
        return res.status(200).json(ApiResponse.success(manualVideos, "Retrieved manually configured videos"));
      }
    }

    // 3. Attempt robust scraper fetch first to bypass unstable RSS feeds
    const scrapedVideos = await fetchVideosFromChannelPage(value);
    if (scrapedVideos && scrapedVideos.length > 0) {
      return res.status(200).json(
        ApiResponse.success(scrapedVideos, "Retrieved channel videos successfully")
      );
    }

    // 4. Otherwise, treat as channel/user and attempt RSS fetch (legacy fallback)
    const channelId = await getChannelIdFromUrl(value);
    if (!channelId) {
      // Fallback to checking if single video link was provided as a channel settings error
      const singleId = extractVideoId(value);
      if (singleId) {
        const fallbackVideo = [{
          videoId: singleId,
          title: "Video Kegiatan",
          published: new Date().toISOString(),
          thumbnail: `https://img.youtube.com/vi/${singleId}/maxresdefault.jpg`,
        }];
        return res.status(200).json(ApiResponse.success(fallbackVideo, "Retrieved single fallback video"));
      }
      return res.status(200).json(ApiResponse.success([], "Could not extract channel ID or video ID from setting"));
    }

    // 4. Fetch RSS feed using channel ID
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedResponse = await fetch(feedUrl);
    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch YouTube RSS feed: ${feedResponse.statusText}`);
    }

    const xml = await feedResponse.text();
    const videos = parseYoutubeFeed(xml);

    return res.status(200).json(
      ApiResponse.success(videos, "Retrieved channel videos successfully")
    );

  } catch (error: any) {
    console.error("Error in getYoutubeVideos controller:", error);
    return res.status(500).json({
      message: error.message || "Failed to retrieve YouTube videos",
    });
  }
};
