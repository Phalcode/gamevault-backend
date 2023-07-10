FROM node:20.2-alpine
ENV SERVER_TZ=UTC
RUN apk add --no-cache tzdata curl && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime
WORKDIR /app
COPY . .
RUN npm i -g pnpm && pnpm i && npm run build
CMD [ "npm", "run", "start:prod" ]
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost/api/v1/health || exit 
