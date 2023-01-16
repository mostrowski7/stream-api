FROM node:lts-bullseye-slim

WORKDIR /usr/src/users-service

COPY --chown=node:node package*.json ./

RUN npm ci --legacy-peer-deps

COPY --chown=node:node . .

RUN npm run build

USER node

CMD ["npm", "run", "start:prod"]