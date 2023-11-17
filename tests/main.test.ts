/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { APIEmbed } from "@discordjs/core";
import { createEmbeds } from "../src/createEmbeds.ts";
import { tweetFixture } from "./fixture.ts";

describe("fixup twitter link", () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            message: "OK",
            tweet: tweetFixture,
          }),
      } as Response)
    );
  });

  afterEach(() => {
    mockFetch?.mockRestore();
  });

  it("ツイートに画像がない投稿", async () => {
    const expected: APIEmbed[] = [
      {
        description: "nodeわからん"
          + `\n\n[<t:1697775688:R>        ](https://twitter.com/kcash510/status/1715221671974682986)`,
        color: 0x000,
        footer: {
          text: `𝕏 - 返信 0 · リポスト 0 · いいね 1`,
        },
        image: {
          url: "",
        },
        author: {
          name: "はるかダディー(@kcash510)",
          url: "https://pbs.twimg.com/profile_images/1676935943499165696/CQfBVnXa_200x200.jpg",
          icon_url: "https://pbs.twimg.com/profile_images/1676935943499165696/CQfBVnXa_200x200.jpg",
        },
      },
    ];
    const { embeds, fixupxLinks } = await createEmbeds(
      "https://twitter.com/kcash510/status/1715221671974682986",
    );

    expect(embeds).toEqual(expected);
    expect(fixupxLinks).toEqual([]);
  });

  it("リンクがない投稿", async () => {
    const expected = { embeds: [], fixupxLinks: [] };
    const result = await createEmbeds("テストな文字列");
    expect(result).toEqual(expected);
  });
  it("APIが取得できない時は何も返さない", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 404,
            message: "Not Found",
          }),
      } as Response)
    );
    const expected = { embeds: [], fixupxLinks: [] };
    const result = await createEmbeds("https://twitter.com/kcash510/status/1715221671974682986");
    expect(result).toEqual(expected);
  });

  it.todo("ツイートに動画がある投稿");
});
