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
const data: RESTPostAPIContextMenuApplicationCommandsJSONBody = {
  name: "Delete tweet previews",
  name_localizations: {
    ja: "削除する",
  },
  type: ApplicationCommandType.Message,
};

/**
 * handles `delete` command.
 */
async function handle({ interaction, api }: {
  interaction: APIMessageApplicationCommandInteraction;
  api: API;
}) {
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
      return;
    });
    if (referencedMessage === undefined) return true;
    if ([interaction.member?.user.id, interaction.user?.id].includes(referencedMessage.author.id)) return true;
    return false;
  };
  if (!(await isDeletable(message))) {
    await api.interactions.followUp(interaction.application_id, interaction.token, {
      content: "このメッセージは削除できません",
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
}

export const deleteCommand = { data, handle };
