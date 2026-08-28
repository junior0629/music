/**
 * YouTube Data API v3 response types.
 *
 * Two endpoints we use:
 *   GET /search?key=...&q=...&type=video&videoCategoryId=10&part=snippet
 *   GET /videos?key=...&id=...&part=contentDetails,snippet
 *
 * Reference: https://developers.google.com/youtube/v3/docs
 */
export interface YouTubeSearchItem {
  kind: 'youtube#searchResult';
  etag: string;
  id: { kind: 'youtube#video'; videoId: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime?: string;
  };
}

export interface YouTubeSearchResponse {
  kind: 'youtube#searchListResponse';
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeSearchItem[];
}

export interface YouTubeVideoItem {
  kind: 'youtube#video';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeSearchItem['snippet']['thumbnails'];
    channelTitle: string;
    liveBroadcastContent: string;
  };
  contentDetails: {
    duration: string; // ISO 8601, e.g. "PT4M13S"
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction?: { allowed?: string[]; blocked?: string[] };
  };
  status: {
    uploadStatus: string;
    failureReason?: string;
    rejectionReason?: string;
    privacyStatus: string;
    publishAt?: string;
    /**
     * Whether the video can be embedded in an iframe player.
     * YouTube respects each video's "Allow embedding" setting;
     * if false, our IFrame player will fail silently to play it.
     */
    embeddable: boolean;
    license: string;
  };
}

export interface YouTubeVideoListResponse {
  kind: 'youtube#videoListResponse';
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeVideoItem[];
}
