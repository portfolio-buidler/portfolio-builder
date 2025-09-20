FROM node:20-alpine AS build

#Set working directory
WORKDIR /app

#Install dependencies
COPY package*.json ./
RUN npm install

#Copy source
COPY . .

#Accept build-time environment variables
ARG VITE_API_BASE_URL=http://localhost:9000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

#Build production bundle
RUN npm run build

#Use lightweight nginx to serve built files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

#Expose port (nginx runs on 80 by default)
EXPOSE 80

#Default command
CMD ["nginx", "-g", "daemon off;"]
