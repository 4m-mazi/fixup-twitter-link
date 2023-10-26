# syntax=docker/dockerfile:1

FROM ghcr.io/jqlang/jq:1.7@sha256:12f998e5a6f3f6916f744ba6f01549f156f624b42f7564e67ec6dd4733973146 as fetch-jq

FROM quay.io/curl/curl-base:8.4.0@sha256:36f04935213478584f0232e3e6d226a8b803cd98477bd20f89aec913c2450532 as fetch-pnpm
WORKDIR /dist
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,from=fetch-jq,source=/jq,target=/mounted-bin/jq \
    curl -fsSL --compressed https://get.pnpm.io/install.sh | sed '/setup --force/d' | sed 's|chmod +x "$tmp_dir/pnpm"|install "$tmp_dir/pnpm" pnpm|' | env PNPM_VERSION=$(cat package.json  | /mounted-bin/jq -r .packageManager | grep -oE '[0-9]+\.[0-9]+\.[0-9]+') sh -

FROM ubuntu:devel@sha256:282510723f2be541c2facce0f7e918641bedd90936f8a76f6f38b7110e299d5c as base
ENV SHELL="sh"
ENV ENV="/tmp/env"
ARG NODE_ENV="development"
RUN mkdir /pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /package
RUN --mount=type=bind,from=fetch-pnpm,source=/dist/pnpm,target=/mounted-bin/pnpm \
    /mounted-bin/pnpm setup --force
COPY .npmrc ./
RUN pnpm config set store-dir /.pnpm-store

FROM base as fetch-deps
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm fetch --ignore-scripts
COPY package.json ./

FROM fetch-deps as dev-deps
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile --offline

FROM base as builder
RUN --mount=type=bind,from=dev-deps,source=/package/node_modules/,target=node_modules/ \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=src/,target=src/ \
    --mount=type=bind,source=.swcrc,target=.swcrc \
    pnpm build

FROM fetch-deps as prod-deps
ARG NODE_ENV="production"
RUN --mount=type=cache,target=/.pnpm-store \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile --offline

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:0a944ba09780b6a4e7a8f30287f88a70d7914ad2ba878233ff8cfffb7479158c
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
WORKDIR /app
COPY --from=base /pnpm/ /pnpm/
COPY --from=builder /package/dist/ ./dist/
COPY --from=prod-deps /package/node_modules/ ./node_modules/
COPY .npmrc package.json ./
ENTRYPOINT [ "pnpm", "--shell-emulator" ]
CMD [ "start" ]
