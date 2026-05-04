FROM alpine:latest

RUN apk add --no-cache bash imagemagick ghostscript

WORKDIR /repo

# Changed from ./optimize.sh to ./image-optimizer/optimize.sh
COPY ./image-optimizer/optimize.sh /usr/local/bin/optimize.sh
RUN chmod +x /usr/local/bin/optimize.sh

ENTRYPOINT ["/usr/local/bin/optimize.sh"]
