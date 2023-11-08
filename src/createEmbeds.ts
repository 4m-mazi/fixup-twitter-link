import type { APIEmbed } from "@discordjs/core";
import type { APITweetResponse } from "./types.ts";

export const createEmbeds = async (
  content: string,
): Promise<{ embeds: APIEmbed[]; fixupxLinks: string[] }> => {
  // Linkの取得
  const TwitterOrXlinks = content.matchAll(
    /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/status\/(?<id>\d+)/g,
  );

  // match結果からidを取得
  const ids = [...new Set(Array.from(TwitterOrXlinks, (match) => match.groups?.["id"]))];
  if (ids.length === 0) {
    return { embeds: [], fixupxLinks: [] };
  }

  // APIの呼び出し
  const responses = await Promise.all(
    ids.map((id) =>
      fetch(`https://api.fxtwitter.com/status/${id}/`)
        .then((res) => res.json())
        .then((data) => {
          return (data as APITweetResponse | undefined)?.tweet;
        })
    ),
  );

  // Embedsの作成
  const fixupxLinks: string[] = [];
  const embeds = responses
    .flatMap(
      (tweet) => {
        if (!tweet) {
          return [];
        }

        if (tweet.poll ?? tweet.media?.videos ?? tweet.quote) {
          fixupxLinks.push(`[_ ︎ _](https://fixupx.com/status/${tweet.id})`);
          return []; // 動画や投票、引用のある場合はEmbedを作成しない
        }

        const embed: APIEmbed = {
          description: tweet.text + `\n\n[<t:${tweet.created_timestamp}:R>        ](${tweet.url})`, // モバイル版でタップする領域を確保するためにスペースが必要
          color: 0x000,
          footer: {
            text: `𝕏 - 返信 ${tweet.replies} · リポスト ${tweet.retweets} · いいね ${tweet.likes}`,
          },
          image: {
            url: tweet.media?.mosaic?.formats.webp
              ?? tweet.media?.photos?.[0]?.url
              ?? "",
          },
          author: {
            name: tweet.author.name + `(@${tweet.author.screen_name})`,
            url: tweet.author.avatar_url ?? "",
            icon_url: tweet.author.avatar_url ?? "",
          },
        };
        return embed;
      },
    );
  return { embeds, fixupxLinks };
};
