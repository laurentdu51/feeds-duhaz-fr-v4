FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM busybox:stable-musl
COPY --from=build /app/dist /var/www/html
EXPOSE 80
CMD ["httpd", "-f", "-p", "80", "-h", "/var/www/html"]
