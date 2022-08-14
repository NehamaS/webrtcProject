#FROM harbor.il-labs.mavenir.com/mcu-dev/builder:16.19 AS WEBRTCGW_BUILD_IMAGE
FROM restcomm/webrtc-app-builders:16.19 AS WEBRTCGW_BUILD_IMAGE
##Build time image

RUN apk add --update --no-cache --virtual .gyp py-pip make g++
ADD . /opt/cpaas

WORKDIR /opt/cpaas

RUN node -v && \
    npm config set registry https://mavenir.jfrog.io/artifactory/api/npm/enterprise-cpass-mav-npm-virtual/ && \
    npm set _auth=cmEtY3BhYXM6TWF2M24xclJhY3BhYXMxMngzNGZnUjdq && \
    ## Next line is for testing purposes Only  \
    ##npm install mcu-logger@1.0.56 && \
    npm i @nestjs/cli && \
    npm ci --unsafe-perm && \
    npm run build && \
    npm rebuild && \
    npm test
RUN automation/automation.sh
RUN npm prune --production
RUN rm -rf src test automation


#FROM harbor.il-labs.mavenir.com/mcu-dev/utils:16.19
FROM restcomm/webrtc-app-utils:16.19
##Run time image

RUN apk add --no-cache grep bash curl tini
ADD ./docker/docker-cmd.sh /docker-cmd.sh

WORKDIR /opt/cpaas/webrtc-gateway

# copy from build image
COPY --from=WEBRTCGW_BUILD_IMAGE /opt/cpaas .

EXPOSE 9001

RUN chmod +x /docker-cmd.sh

ENTRYPOINT    ["/sbin/tini", "-g", "-v", "--","/docker-cmd.sh"]
#CMD ["/bin/sh"]