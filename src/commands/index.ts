import { Collection } from "@discordjs/collection";
import type {
  API,
  APIMessageApplicationCommandInteraction,
  RESTPutAPIApplicationCommandsJSONBody,
} from "@discordjs/core";
import { deleteCommand } from "./message/delete.js";

const commands = new Collection([
  [deleteCommand.data.name, deleteCommand],
]);

export const commandsRegister = ({ api, applicationId }: { api: API; applicationId: string }) => {
  const body: RESTPutAPIApplicationCommandsJSONBody = commands.map(({ data }) => data);
  return api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, body);
};

export const messageCommandsHandler = ({ interaction, api }: {
  interaction: APIMessageApplicationCommandInteraction;
  api: API;
}) => {
  return commands.get(interaction.data.name)?.handle({ interaction, api });
};
