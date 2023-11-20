import { Collection } from "@discordjs/collection";
import type {
  API,
  APIMessageApplicationCommandInteraction,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
} from "@discordjs/core";
import { deleteCommand } from "./message/delete.js";

const commands = new Collection([
  [deleteCommand.data.name, deleteCommand],
]);

export const commandsRegister = (({ api, applicationId }) => {
  const body: RESTPutAPIApplicationCommandsJSONBody = commands.map(({ data }) => data);
  return api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, body);
}) satisfies (
  { api, applicationId }: { api: API; applicationId: string },
) => Promise<RESTPutAPIApplicationCommandsResult>;

export const messageCommandsHandler = (({ interaction, api }) => {
  return commands.get(interaction.data.name)?.handle({ interaction, api });
}) satisfies ({ interaction, api }: {
  interaction: APIMessageApplicationCommandInteraction;
  api: API;
}) => Promise<void> | undefined;
