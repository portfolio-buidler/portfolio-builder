FROM node:20-alpine

#Set working directory
WORKDIR /app

# Copy only dependency manifests for cached layer
COPY package*.json ./
RUN npm install --no-audit --no-fund

# In dev we mount the source via docker-compose, so no COPY . . needed.
# Fallback: if someone builds without compose, uncomment below line.
# COPY . .

# Backend service name resolution inside compose network
ENV VITE_API_BASE_URL=http://backend:9000 \
	CHOKIDAR_USEPOLLING=true \
	WATCHPACK_POLLING=true

EXPOSE 3000

CMD ["npm","run","dev","--","--host","0.0.0.0","--port","3000"]
