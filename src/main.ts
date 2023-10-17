/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type APIEmbed,
  type APIMessageReferenceSend,
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  MessageFlags,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";

const token = process.env.DISCORD_TOKEN
  ?? (() => {
    throw new Error("DISCORD_TOKEN is not defined");
  })();

// Create REST and WebSocket managers directly
const rest = new REST({ version: "10" }).setToken(token);

const gateway = new WebSocketManager({
  token: token,
  intents: GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent,
  rest,
});

// Create a client to emit relevant events.
const client = new Client({ rest, gateway });

client.on(
  GatewayDispatchEvents.MessageCreate,
  async ({ data: message, api }) => {
    if (!message.content || message.author.bot) {
      return;
    }

    // Linkの取得
    const TwitterOrXlinks = message.content.matchAll(
      /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/status\/(?<id>\d+)/g,
    );

    // match結果からidを取得
    const ids = [...TwitterOrXlinks].map((match) => match.groups?.["id"]);
    if (ids.length === 0) {
      return;
    }

    // APIの呼び出し
    const responses = await Promise.all(
      ids.map((id) => fetch(`https://api.fxtwitter.com/status/${id}/`).then((res) => res.json())),
    );

    // TwitterのOGPを削除する
    await api.channels.editMessage(message.channel_id, message.id, {
      flags: MessageFlags.SuppressEmbeds,
    });

    // Embedsの作成
    const fixupxLinks: string[] = [];
    const embeds = responses.flatMap((r: any) => {
      const tweet = r.tweet;
      if (tweet.poll || tweet.media?.videos || tweet.quote) {
        fixupxLinks.push(`[_\u{fe0e} _](https://fixupx.com/status/${tweet.id})`);
        return []; // 動画や投票、引用のある場合はEmbedを作成しない
      }

      const embed: APIEmbed = {
        description: tweet.text + `\n\n<t:${tweet.created_timestamp}:R>`,
        color: 0x000,
        footer: {
          text: `\u{1d54f} - 返信 ${tweet.replies} · リポスト ${tweet.retweets} · いいね ${tweet.likes}`,
        },
        image: {
          url: tweet.media?.mosaic?.formats?.webp ?? tweet.media?.photos?.[0]?.url,
        },
        author: {
          name: tweet.author.name + `(@${tweet.author.screen_name})`,
          url: tweet.author.url,
          icon_url: tweet.author.avatar_url,
        },
      };
      return embed;
    });

    // 返信
    const ref: APIMessageReferenceSend = {
      channel_id: message.channel_id,
      message_id: message.id,
    };

    await api.channels.createMessage(message.channel_id, {
      embeds: embeds,
      content: fixupxLinks.join("\n"),
      message_reference: ref,
      allowed_mentions: {
        parse: [],
        roles: [],
        users: [],
        replied_user: false,
      },
    });
  },
);

// Listen for the ready event
client.once(GatewayDispatchEvents.Ready, () => {
  console.log("Ready!");
});

// Start the WebSocket connection.
await gateway.connect();
