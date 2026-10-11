# better-sqlite3 のネイティブ依存を確実にビルドするため slim ではなく通常の node:20 を使用
FROM node:20
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
