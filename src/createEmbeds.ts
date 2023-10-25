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
  const ids = [...TwitterOrXlinks].map((match) => match.groups?.["id"]);
  if (ids.length === 0) {
    return { embeds: [], fixupxLinks: [] };
  }

  // APIの呼び出し
  const responses = await Promise.all(
    ids.map((id) =>
      fetch(`https://api.fxtwitter.com/status/${id}/`)
        .then((res) => res.json())
        .then((data) => {
          return (data as APITweetResponse).tweet;
        })
    ),
  );
  console.log(responses);

  // Embedsの作成
  const fixupxLinks: string[] = [];
  const embeds = responses
    .filter((res) => res !== undefined) // たまに404が返ってくるので弾く
    .flatMap(
      (tweet) => {
        if (tweet.poll ?? tweet.media?.videos ?? tweet.quote) {
          fixupxLinks.push(`[_ ︎ _](https://fixupx.com/status/${tweet.id})`);
          return []; // 動画や投票、引用のある場合はEmbedを作成しない
        }

        const embed: APIEmbed = {
          description: tweet.text + `\n\n<t:${tweet.created_timestamp}:R>`,
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
