import { Collection } from "@discordjs/collection";
import type {
  API,
  APIMessageApplicationCommandInteraction,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
} from "@discordjs/core";
import { deleteCommand } from "./message/delete.js";

const messageCommands = new Collection([
  [deleteCommand.data.name, deleteCommand],
]);

export const commandsRegister = (({ api, applicationId }) => {
  const body = messageCommands.map(({ data }) => data) satisfies RESTPutAPIApplicationCommandsJSONBody;
  return api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, body);
}) satisfies (
  { api, applicationId }: { api: API; applicationId: string },
) => Promise<RESTPutAPIApplicationCommandsResult>;

export const messageCommandsHandler = (({ interaction, api }) => {
  return messageCommands.get(interaction.data.name)?.handle({ interaction, api });
}) satisfies ({ interaction, api }: {
  interaction: APIMessageApplicationCommandInteraction;
  api: API;
}) => Promise<void> | undefined;
