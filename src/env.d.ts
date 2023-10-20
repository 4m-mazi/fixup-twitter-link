declare namespace NodeJS {
  interface ProcessEnv {
    readonly DISCORD_TOKEN: string | undefined;
    readonly NODE_ENV: string | undefined;
  }
}
