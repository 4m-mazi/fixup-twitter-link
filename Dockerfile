# syntax=docker/dockerfile:1.9.0@sha256:fe40cf4e92cd0c467be2cfc30657a680ae2398318afd50b0c80585784c604f28

FROM ghcr.io/jqlang/jq:1.7@sha256:12f998e5a6f3f6916f744ba6f01549f156f624b42f7564e67ec6dd4733973146 as fetch-jq

FROM quay.io/curl/curl-base:8.9.1@sha256:f0cbc0ff89a8336f7050f3739454ba3df8420572bfa3376eea463c38f504311d as fetch-pnpm
ENV SHELL="sh"
ENV ENV="/tmp/env"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /dist
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,from=fetch-jq,source=/jq,target=/mounted-bin/jq \
    curl -fsSL --compressed https://get.pnpm.io/install.sh | env PNPM_VERSION=$(cat package.json  | /mounted-bin/jq -r .packageManager | grep -oE '[0-9]+\.[0-9]+\.[0-9]+') sh -

FROM ubuntu:devel@sha256:ec705e3704caa11dbe38b62469eee39fc7d2af812bb2ea2ba931790d8d972fed as fetch-deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /package
COPY --link --from=fetch-pnpm /pnpm/ /pnpm/
RUN pnpm config set store-dir /.pnpm-store
COPY --link .npmrc ./
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm fetch
COPY --link package.json ./

FROM fetch-deps as dev-deps
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile --offline

FROM ubuntu:devel@sha256:ec705e3704caa11dbe38b62469eee39fc7d2af812bb2ea2ba931790d8d972fed as builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /package
RUN --mount=type=bind,from=fetch-deps,source=/pnpm/,target=/pnpm/ \
    --mount=type=bind,from=dev-deps,source=/package/node_modules/,target=node_modules/ \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=.npmrc,target=.npmrc \
    --mount=type=bind,source=src/,target=src/ \
    --mount=type=bind,source=.swcrc,target=.swcrc \
    pnpm build

FROM fetch-deps as prod-deps
ARG NODE_ENV="production"
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile --offline

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:eeb716b8a36ecf37992cb8f1e716a4b5737c086fd3bcbb08b5c9588ad5c8a701
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
WORKDIR /app
COPY --link --from=fetch-deps /pnpm/ /pnpm/
COPY --link --from=builder /package/dist/ ./dist/
COPY --from=prod-deps /package/node_modules/ ./node_modules/
COPY --link .npmrc package.json ./
ENTRYPOINT [ "pnpm", "--shell-emulator" ]
CMD [ "start" ]
