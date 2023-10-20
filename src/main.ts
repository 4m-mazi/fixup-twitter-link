import {
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  MessageFlags,
  type APIMessageReferenceSend,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { createEmbeds } from "./createEmbeds.js";
import Sentry, { transaction } from "./lib/sentry.js";

const token =
  process.env.DISCORD_TOKEN ??
  (() => {
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

    try {
      const { embeds, fixupxLinks } = await createEmbeds(message.content);

      // TwitterのOGPを削除する
      await api.channels.editMessage(message.channel_id, message.id, {
        flags: MessageFlags.SuppressEmbeds,
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
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      transaction.finish();
    }
  }
);

// Listen for the ready event
client.once(GatewayDispatchEvents.Ready, () => {
  console.log("Ready!");
});

// Start the WebSocket connection.
await gateway.connect();
