FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p src/uploads/courses src/uploads/thumbnails

EXPOSE 5000

CMD ["node", "server.js"]
