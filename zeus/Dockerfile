FROM node:12-slim

# Create app directory
WORKDIR /home/node/app

# set app directoy ownership to user node of group node
RUN chown -R node:node .

# change user
USER node

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./zeus/package*.json ./
COPY ./zeus/yarn.lock ./

# build time argument to add tools for development
ARG NODE_ENV=production

# root level operations start here
USER root

RUN yarn install

# global install needs root privileges. Only installed during development
RUN if [ "$NODE_ENV" = "development" ] ; then npm install -g nodemon ; fi

# COPY always copies files as root. change owner after copy
COPY ./zeus/src ./src
RUN chown -R node:node ./src/*

USER node
