# syntax=docker/dockerfile:1

# FleetTrack Admin — Next.js 16 (App Router) served from the standalone output enabled in
# next.config.ts (STEP 3). Alpine is safe here: this app pulls no native runtime addon
# (no next/image + sharp — every image is a plain <img>), and package-lock.json carries
# the musl builds of @next/swc and lightningcss that `npm ci` needs.

########################  build stage  ########################
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The three NEXT_PUBLIC_* values are read at module scope in client code
# (lib/fetcher.ts, lib/socket.ts, tracking-map.tsx, trip-route-map.tsx), so Next INLINES
# them into the client bundle during `next build`. They must therefore exist HERE, at
# build time — passing them at `docker run` does nothing, the strings are already baked.
# Changing any of them means rebuilding the image, not restarting the container.
#
# They are public by definition: NEXT_PUBLIC_* ships to the browser and is readable by
# anyone with devtools. That is expected for these three. Restrict the Maps key by HTTP
# referrer in Google Cloud Console — that, not secrecy, is what protects it.
#
# No server-only variable exists in this app (verified: every process.env reference in
# src/ is NEXT_PUBLIC_*), so nothing secret belongs in this image at all.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

########################  runtime stage  ######################
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    # Standalone defaults to binding localhost, which is unreachable from outside the
    # container. 0.0.0.0 is required for the reverse proxy to connect.
    HOSTNAME=0.0.0.0

# The standalone bundle already contains the traced subset of node_modules it needs, so
# no npm install happens in this stage. Its contents go to the WORKDIR ROOT — server.js
# resolves .next/static and public relative to its own location, so nesting it under
# .next/standalone/ would 404 every asset. This IS the standalone server (not `next
# start`); `node server.js` here is exactly `node .next/standalone/server.js` there.
COPY --from=build --chown=node:node /app/.next/standalone ./
# Static assets and public/ are deliberately NOT part of the standalone trace.
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
