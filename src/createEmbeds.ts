import type { APIEmbed } from "@discordjs/core";
import type { APITweet, APITweetResponse } from "./types.ts";

const createDescription = ((tweet) => {
  const strings: string[] = [tweet.text.replaceAll(">", "\\>")];
  if (tweet.quote !== undefined) {
    strings.push(
      [
        `[${tweet.quote.author.name}(@${tweet.quote.author.screen_name}) <t:${tweet.quote.created_timestamp.toString()}:R>](${tweet.quote.url})`,
        tweet.quote.text,
      ].join("\n").replaceAll(/^/gm, "> "),
    );
  }
  strings.push(`[<t:${tweet.created_timestamp.toString()}:R>        ](${tweet.url})`); // モバイル版でタップする領域を確保するためにスペースが必要
  return strings.join("\n\n");
}) satisfies (tweet: APITweet) => string;

export const createEmbeds = (async (
  content,
) => {
  // Linkの取得
  const TwitterOrXlinks = content.matchAll(
    /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/status\/(?<id>\d+)/g,
  );

  // match結果からidを取得
  // HACK
  const ids = [
    ...new Set(Array.from(TwitterOrXlinks, (match) => match.groups?.["id"]).filter((id) => id !== undefined)),
  ] as string[];
  if (ids.length === 0) {
    return { embeds: [], fixupxLinks: [] };
  }

  // APIの呼び出し
  const responses = await Promise.all(
    ids.map((id) =>
      fetch(`https://api.fxtwitter.com/status/${id}`, {
        headers: new Headers({
          "User-Agent": "fixup-twitter-link-bot (+https://github.com/4m-mazi/fixup-twitter-link)",
        }),
      })
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

        if (tweet.poll ?? tweet.media?.videos) {
          fixupxLinks.push(`[_ ︎ _](https://fixupx.com/status/${tweet.id})`);
          return []; // 動画や投票、引用のある場合はEmbedを作成しない
        }

        return {
          description: createDescription(tweet),
          color: 0x000,
          footer: {
            text:
              `𝕏 - 返信 ${tweet.replies.toString()} · リポスト ${tweet.retweets.toString()} · いいね ${tweet.likes.toString()}`,
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
        } satisfies APIEmbed;
      },
    );
  return { embeds, fixupxLinks };
}) satisfies (content: string) => Promise<{ embeds: APIEmbed[]; fixupxLinks: string[] }>;
