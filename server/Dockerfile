#FROM node:16-alpine
FROM node:16-bullseye

ENV HOME_DIR /home/app
ENV API_DIR $HOME_DIR/crm_server
#ENV LIB_DIR $API_DIR/lib

ENV TZ=Europe/Kiev

RUN apt-get update -y && \
    apt-get install -yq tzdata && \
    ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata

COPY ./server $API_DIR
#COPY ./lib/dist/microtron $LIB_DIR/microtron

WORKDIR $API_DIR
RUN npm install

EXPOSE $PORT

#ENTRYPOINT ["/bin/sh"]
#CMD npm start:dev
