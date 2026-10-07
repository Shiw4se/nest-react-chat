# syntax=docker/dockerfile:1

# ---- build the SPA
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Empty API/WS URLs = same origin: nginx below proxies /v1, /socket.io and
# /uploads to the backend, so the browser never needs a second origin.
ARG VITE_API_URL=
ARG VITE_WS_URL=
ARG VITE_DEMO_ACCOUNTS=
ARG VITE_DEMO_PASSWORD=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_DEMO_ACCOUNTS=$VITE_DEMO_ACCOUNTS \
    VITE_DEMO_PASSWORD=$VITE_DEMO_PASSWORD
RUN npm run build

# ---- serve with nginx
FROM nginx:1.27-alpine
# Templates are rendered with envsubst at start; only defined variables
# (BACKEND_URL) are replaced, nginx's own $vars are left alone.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:3000
EXPOSE 80
