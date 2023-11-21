import {
  API,
  type APIMessage,
  type APIMessageApplicationCommandInteraction,
  ApplicationCommandType,
  MessageFlags,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "@discordjs/core";
import { DiscordAPIError } from "@discordjs/rest";

/**
 * `delete` command data.
 */
const data = {
  name: "Delete tweet previews",
  name_localizations: {
    ja: "削除する",
  },
  type: ApplicationCommandType.Message,
} satisfies RESTPostAPIContextMenuApplicationCommandsJSONBody;

/**
 * handles `delete` command.
 */
const handle = (async ({ interaction, api }) => {
  await api.interactions.defer(interaction.id, interaction.token, {
    flags: MessageFlags.Ephemeral,
  });
  const message = Object.values(interaction.data.resolved.messages)[0];
  const isDeletable = async (message: APIMessage | undefined): Promise<boolean> => {
    if (message?.author.id !== interaction.application_id) return false;
    if (message.message_reference == null) return false;
    if (message.message_reference.message_id === undefined) return true;
    const referencedMessage = await api.channels.getMessage(
      message.message_reference.channel_id,
      message.message_reference.message_id,
    ).catch((e) => {
      if (!(e instanceof DiscordAPIError && e.code === 10008)) throw e;
      return undefined;
    }) satisfies APIMessage | undefined;
    if (referencedMessage === undefined) return true;
    if ([interaction.member?.user.id, interaction.user?.id].includes(referencedMessage.author.id)) return true;
    return false;
  };
  if (!(await isDeletable(message))) {
    await api.interactions.followUp(interaction.application_id, interaction.token, {
      content: [
        "😐",
        "このコマンドの実行対象には、以下の制約があります。",
        `1. <@${interaction.application_id}>によるメッセージであること`,
        "1. あなたの送信したメッセージに対する返信であること",
      ].join("\n"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await api.channels.deleteMessage(message!.channel_id, message!.id);
  await api.interactions.followUp(interaction.application_id, interaction.token, {
    content: "削除しました",
    flags: MessageFlags.Ephemeral,
  });
}) satisfies ({ interaction, api }: {
  interaction: APIMessageApplicationCommandInteraction;
  api: API;
}) => Promise<void>;

export const deleteCommand = { data, handle };
