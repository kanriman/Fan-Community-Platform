// src/app/api/live/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// キャッシュを保持する変数
let liveCache = {
  lastUpdated: 0,
  data: [],
};

export async function GET() {
  // キャッシュが30秒以内に更新されている場合はキャッシュを返す
  const now = Date.now();
  if (now - liveCache.lastUpdated < 30000 && liveCache.data.length > 0) {
    return NextResponse.json(liveCache.data);
  }

  try {
    // データベースから配信者情報を取得
    const streamers = await prisma.streamer.findMany();

    // 配信状況をチェックする
    const liveStreams = await Promise.all(
      streamers.map(async (streamer) => {
        const liveStatus = await checkLiveStatus(streamer);
        return liveStatus;
      })
    );

    // nullを除外（配信していない配信者）
    const activeLiveStreams = liveStreams.filter(Boolean);

    // キャッシュを更新
    liveCache = {
      lastUpdated: now,
      data: activeLiveStreams,
    };

    return NextResponse.json(activeLiveStreams);
  } catch (error) {
    console.error("Error fetching live streams:", error);
    return NextResponse.json({ error: "Failed to fetch live streams" }, { status: 500 });
  }
}

// 配信者のライブ状態をチェックする関数
async function checkLiveStatus(streamer) {
  switch (streamer.platform) {
    case "YOUTUBE":
      return checkYouTubeLive(streamer);
    case "TWITCH":
      return checkTwitchLive(streamer);
    case "KICK":
      return checkKickLive(streamer);
    case "TWITCASTING":
      return checkTwitcastingLive(streamer);
    default:
      return null;
  }
}

// YouTube配信のチェック
async function checkYouTubeLive(streamer) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${streamer.platformId}&type=video&eventType=live&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();

    // ライブ配信がない場合
    if (!data.items || data.items.length === 0) {
      return null;
    }

    // ライブ配信の詳細を取得
    const liveVideoId = data.items[0].id.videoId;
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${liveVideoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API returned ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    const videoDetails = videoData.items[0];

    return {
      id: `youtube-${streamer.id}`,
      streamerName: streamer.name,
      platform: "YOUTUBE",
      title: videoDetails.snippet.title,
      thumbnailUrl: videoDetails.snippet.thumbnails.high.url,
      viewerCount: parseInt(videoDetails.liveStreamingDetails.concurrentViewers || "0", 10),
      streamUrl: `https://www.youtube.com/watch?v=${liveVideoId}`,
    };
  } catch (error) {
    console.error(`Error checking YouTube live status for ${streamer.name}:`, error);
    return null;
  }
}

// Twitch配信のチェック
async function checkTwitchLive(streamer) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    // トークンを取得
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Twitch token API returned ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // ストリーム情報を取得
    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${streamer.platformId}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!streamResponse.ok) {
      throw new Error(`Twitch API returned ${streamResponse.status}`);
    }

    const streamData = await streamResponse.json();

    // ライブ配信がない場合
    if (!streamData.data || streamData.data.length === 0) {
      return null;
    }

    const stream = streamData.data[0];

    // ユーザー情報を取得して名前を取得
    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?id=${streamer.platformId}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(`Twitch API returned ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const user = userData.data[0];

    return {
      id: `twitch-${streamer.id}`,
      streamerName: streamer.name,
      platform: "TWITCH",
      title: stream.title,
      thumbnailUrl: stream.thumbnail_url.replace("{width}", "640").replace("{height}", "360"),
      viewerCount: stream.viewer_count,
      streamUrl: `https://twitch.tv/${user.login}`,
    };
  } catch (error) {
    console.error(`Error checking Twitch live status for ${streamer.name}:`, error);
    return null;
  }
}

// KICKのライブチェック (APIがない場合はダミーデータを返す例)
async function checkKickLive(streamer) {
  // 注: KICKは現在公式APIがないため、実際の実装ではスクレイピングなどが必要
  try {
    // ここでは適当に80%の確率でライブ中とする（デモ用）
    const isLive = Math.random() > 0.2;
    
    if (!isLive) {
      return null;
    }

    return {
      id: `kick-${streamer.id}`,
      streamerName: streamer.name,
      platform: "KICK",
      title: `${streamer.name}のライブ配信`,
      thumbnailUrl: "https://via.placeholder.com/640x360",
      viewerCount: Math.floor(Math.random() * 1000),
      streamUrl: `https://kick.com/${streamer.platformId}`,
    };
  } catch (error) {
    console.error(`Error checking KICK live status for ${streamer.name}:`, error);
    return null;
  }
}

// ツイキャスのライブチェック
async function checkTwitcastingLive(streamer) {
  try {
    const response = await fetch(
      `https://apiv2.twitcasting.tv/users/${streamer.platformId}`,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Version": "2.0",
          Authorization: `Bearer ${process.env.TWITCASTING_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Twitcasting API returned ${response.status}`);
    }

    const data = await response.json();
    
    // ライブ配信していない場合
    if (!data.user.is_live) {
      return null;
    }

    // ライブ情報の取得
    const liveResponse = await fetch(
      `https://apiv2.twitcasting.tv/users/${streamer.platformId}/current_live`,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Version": "2.0",
          Authorization: `Bearer ${process.env.TWITCASTING_ACCESS_TOKEN}`,
        },
      }
    );

    if (!liveResponse.ok) {
      throw new Error(`Twitcasting Live API returned ${liveResponse.status}`);
    }

    const liveData = await liveResponse.json();

    return {
      id: `twitcasting-${streamer.id}`,
      streamerName: streamer.name,
      platform: "TWITCASTING",
      title: liveData.movie.title || `${streamer.name}のライブ配信`,
      thumbnailUrl: liveData.movie.large_thumbnail,
      viewerCount: liveData.movie.current_view_count,
      streamUrl: `https://twitcasting.tv/${streamer.platformId}`,
    };
  } catch (error) {
    console.error(`Error checking Twitcasting live status for ${streamer.name}:`, error);
    return null;
  }
}