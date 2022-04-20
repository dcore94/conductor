#
# Netflix conductor: Generate images for deployment of Server, protected UI and Nginx acting as router and pep to be deplyed on NW cluster  
#
# ===========================================================================================================
# 0. Builder stage
# ===========================================================================================================
FROM openjdk:11-jdk AS builder
LABEL maintainer="Nubisware <info@nubisware.com>"

# Install Node
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get update -qq \
  && apt-get install -qq --no-install-recommends \
    build-essential \
    nodejs \
    yarn \
  && apt-get upgrade -qq \
  && rm -rf /var/lib/apt/lists/*

# Copy the project onto the builder image
COPY . /conductor

# Build the server
WORKDIR /conductor
RUN ./gradlew build -x test

# Build the client
WORKDIR /conductor/ui
RUN yarn install && yarn build

