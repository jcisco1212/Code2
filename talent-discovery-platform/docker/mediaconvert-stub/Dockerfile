FROM node:18-alpine

WORKDIR /app

# Install FFmpeg for video transcoding
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
