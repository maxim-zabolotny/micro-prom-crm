#FROM node:16-alpine
FROM node:16-bullseye

ENV HOME_DIR /home/app
ENV WEB_DIR $HOME_DIR/crm_web

COPY ./client $WEB_DIR

WORKDIR $WEB_DIR
RUN npm install

EXPOSE $PORT

#ENTRYPOINT ["/bin/sh"]
#CMD npm start:dev