FROM node:22-bookworm-slim

ENV NPM_CONFIG_CACHE=/opt/jamissue-npm-cache

WORKDIR /opt/jamissue

COPY package.json package-lock.json ./

RUN npm cache add wrangler@4.74.0 \
    && npm ci --ignore-scripts --include=dev \
    && rm -rf node_modules \
    && npm cache verify
