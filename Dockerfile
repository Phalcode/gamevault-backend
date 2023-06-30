FROM node:lts-alpine
ENV SERVER_TZ=UTC
RUN apk add --no-cache tzdata && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime
WORKDIR /app
COPY . .
RUN npm i -g pnpm && pnpm i && npm run build
CMD [ "npm", "run", "start:prod" ]
EXPOSE 8080
