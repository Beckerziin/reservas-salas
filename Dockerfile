# Imagem base leve e com suporte LTS ao Node 20.
FROM node:20-alpine

# Diretorio de trabalho dentro do container.
WORKDIR /app

# Instala dependencias primeiro (melhor uso do cache de camadas).
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copia o restante do codigo.
COPY . .

# Porta exposta pela API.
EXPOSE 3000

# Usuario nao-root por seguranca.
USER node

# Sobe o servidor.
CMD ["node", "src/server.js"]
