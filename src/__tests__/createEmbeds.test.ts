/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { APIEmbed } from "@discordjs/core";
import { createEmbeds } from "../createEmbeds.ts";
import { tweetFixture } from "./__fixtures__/fixture.ts";

import tweetWithQuote from "./__fixtures__/tweetWithQuote.json";

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

  it("引用投稿へのリンク", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(tweetWithQuote),
      } as Response)
    );
    const expected = {
      embeds: [
        {
          description: "この本はとても面白かったからみんなにおすすめしたい\n"
            + "感動と笑いとサスペンスが詰まってるよ\n"
            + "https://example.jp/awesome-book\n"
            + "\n"
            + "> [たろう(@taro456) <t:1699282877:R>](https://example.net/taro456/status/2468135790246813579 )\n"
            + "> 今日は久しぶりに友達とカラオケに行ったよ\n"
            + "> 楽しかったなあ\n"
            + "> https://example.jp/songs\n"
            + "\n"
            + "[<t:1699285014:R>        ](https://example.net/akira123/status/1234567890123456789)",
          color: 0,
          footer: { text: "𝕏 - 返信 0 · リポスト 0 · いいね 1" },
          image: { url: "" },
          author: {
            name: "あきら(@akira123)",
            url: "https://example.com/profile_images/1357924680135792468/CQfBVnXa_200x200.jpg",
            icon_url: "https://example.com/profile_images/1357924680135792468/CQfBVnXa_200x200.jpg",
          },
        },
      ],
      fixupxLinks: [],
    };
    const result = await createEmbeds("https://twitter.com/kcash510/status/1715221671974682986");
    expect(result).toEqual(expected);
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
