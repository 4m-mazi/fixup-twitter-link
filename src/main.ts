import {
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIMessageReferenceSend,
  ApplicationCommandType,
  Client,
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  MessageFlags,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { commandsRegister, messageCommandsHandler } from "./commands/index.js";
import { createEmbeds } from "./createEmbeds.js";
import Sentry, { transaction } from "./lib/sentry.js";

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

    try {
      const { embeds, fixupxLinks } = await createEmbeds(message.content);

      if (embeds.length === 0 && fixupxLinks.length === 0) return;

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
        content: fixupxLinks.join(""),
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
  },
);

client.on(GatewayDispatchEvents.InteractionCreate, async ({ data: interaction, api }) => {
  const isMessageCommand = (interaction: APIInteraction): interaction is APIMessageApplicationCommandInteraction =>
    interaction.type === InteractionType.ApplicationCommand
    && interaction.data.type === ApplicationCommandType.Message;
  if (
    !isMessageCommand(interaction)
  ) return;
  await messageCommandsHandler({ interaction, api });
});

// Listen for the ready event
client.once(GatewayDispatchEvents.Ready, async ({ data: readyData, api }) => {
  await commandsRegister({ api, applicationId: readyData.application.id });
  console.log("Ready!");
});

// Start the WebSocket connection.
await gateway.connect();
