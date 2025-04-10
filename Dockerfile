FROM node:20.18

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p /app/dist/context/db/migrations
COPY context/db/migrations/ /app/dist/context/db/migrations/

EXPOSE 8080

ENV START_COMMAND="server"
CMD ["sh", "-c", "npm run $START_COMMAND"]
