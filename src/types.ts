export type APITweetResponse = {
  code: number;
  message: string;
  tweet: APITweet;
};

// The container of all the information for a Tweet
type APITweet = {
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;
  color: string | null;
  lang: string | null;
  replying_to: string | null;
  replying_to_status: string | null;
  twitter_card: "tweet" | "summary" | "summary_large_image" | "player";
  author: APIAuthor;
  likes: number;
  retweets: number;
  replies: number;
  views: number | null;
  quote?: APITweet;
  poll?: APIPoll;
  translation?: APITranslate;
  media?: {
    external?: APIExternalMedia;
    photos?: APIPhoto[];
    videos?: APIVideo[];
    mosaic?: APIMosaicPhoto;
  };
  source: string;
};

// Information about the author of a tweet
type APIAuthor = {
  id?: string;
  name: string;
  screen_name: string;
  avatar_url?: string;
  avatar_color?: string | null;
  banner_url?: string;
  description?: string;
};

// Data for a single photo in a Tweet
type APIPhoto = {
  type: "photo";
  url: string;
  width: number;
  height: number;
};

// Data for a poll on a given Tweet
type APIPoll = {
  choices: APIPollChoice[];
  total_votes: number;
  ends_at: string;
  time_left_en: string;
};

// Data for a single choice in a poll
type APIPollChoice = {
  label: string;
  count: number;
  percentage: number;
};

// Information about a requested translation for a Tweet, when asked.
type APITranslate = {
  text: string;
  source_lang: string;
  target_lang: string;
};

// Data for external media, currently only video.
type APIExternalMedia = {
  type: string;
  url: string;
  height: number;
  width: number;
  duration: number;
};

// Data for the mosaic service, which stitches photos together
type APIMosaicPhoto = {
  type: "mosaic_photo";
  width: number;
  height: number;
  formats: {
    webp: string;
    jpeg: string;
  };
};

// Data for a Tweet's video
type APIVideo = {
  type: "video" | "gif";
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  format: string;
};
