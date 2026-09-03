FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Substitute the "dev" for "build" if you want to build the app
CMD ["npm", "run", "dev"]
