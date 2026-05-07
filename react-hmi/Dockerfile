FROM node:latest

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package.json ./
RUN npm install

# Copiar el resto del código
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
