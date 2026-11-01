// Normalisasi link konten sosmed (YouTube / Instagram) menjadi embed URL siap tampil

export type PlatformSosmed = "YOUTUBE" | "INSTAGRAM";

export interface KontenSosmed {
  kontenId: string;
  embedUrl: string;
  thumbnail: string | null;
}

// Ambil video ID dari link YouTube (watch, youtu.be, embed, shorts, live, atau ID langsung)
export function extractVideoId(url: string): string | null {
  const val = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = val.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  const pathRegExp = /\/(shorts|live)\/([a-zA-Z0-9_-]{11})/;
  const pathMatch = val.match(pathRegExp);
  if (pathMatch && pathMatch[2]) {
    return pathMatch[2];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(val)) {
    return val;
  }
  return null;
}

// Ambil jenis & kode post Instagram dari link /p/, /reel/, /reels/, atau /tv/
function extractInstagramPost(url: string): { tipe: "p" | "reel"; kode: string } | null {
  const match = url.trim().match(/instagram\.com\/(?:[\w.]+\/)?(p|reels?|tv)\/([a-zA-Z0-9_-]+)/i);
  if (!match) return null;
  const tipe = match[1].toLowerCase().startsWith("reel") ? "reel" : "p";
  return { tipe, kode: match[2] };
}

// Kembalikan null jika link tidak dikenali untuk platform tersebut
export function normalisasiLinkSosmed(platform: PlatformSosmed, url: string): KontenSosmed | null {
  if (platform === "YOUTUBE") {
    if (!/youtube\.com|youtu\.be/i.test(url)) return null;
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    return {
      kontenId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  const post = extractInstagramPost(url);
  if (!post) return null;
  return {
    kontenId: post.kode,
    embedUrl: `https://www.instagram.com/${post.tipe}/${post.kode}/embed`,
    thumbnail: null,
  };
}

// Judul asli video YouTube via oEmbed publik (tanpa token). Gagal -> null, tidak melempar error.
export async function ambilJudulYoutube(videoId: string): Promise<string | null> {
  try {
    const watchUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    const response = await fetch(`https://www.youtube.com/oembed?url=${watchUrl}&format=json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    return data.title?.trim() || null;
  } catch {
    return null;
  }
}
