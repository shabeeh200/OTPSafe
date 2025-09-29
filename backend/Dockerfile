# simple Dockerfile for Back4App
FROM node:18

WORKDIR /usr/src/app

# copy package files, install deps
COPY package*.json ./
RUN npm install

# copy source, build TypeScript
COPY . .
RUN npm run build

# Back4App will set PORT; we expose 3000 by default
EXPOSE 3000

# start the built app
CMD ["npm", "start"]
