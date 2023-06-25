FROM node:18.12.1

WORKDIR /code

RUN apt update && apt-get install -y nano