const express = require("express");
require("dotenv").config();
const app = express();
const dbConfig = require("./config/dbConfig");
const port = process.env.PORT || 5000;

const usersRoute = require("./routes/usersRoute");
const chatsRoute = require("./routes/chatsRoute");
const messagesRoute = require("./routes/messagesRoute");

app.use(
  express.json({
    limit: "50mb", // Limita o tamanho máximo do corpo da requisição para 50 MB
  })
);

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000", // Permite requisições CORS do front-end na porta 3000
    methods: ["GET", "POST"], // Métodos HTTP permitidos
  },
});

// Variável para armazenar usuários online
let onlineUsers = [];

io.on("connection", (socket) => {
  // Evento disparado quando o socket se conecta

  // Adiciona o usuário a uma sala específica
  socket.on("join-room", (userId) => {
    socket.join(userId); // Junta o usuário à sala com seu ID
  });

  // Envia uma mensagem para os clientes que estão nas salas dos membros da conversa
  socket.on("send-message", (message) => {
    io.to(message.members[0])
      .to(message.members[1])
      .emit("receive-message", message); // Emite a mensagem recebida para ambos os membros
  });

  // Limpa as mensagens não lidas para os membros da conversa
  socket.on("clear-unread-messages", (data) => {
    io.to(data.members[0])
      .to(data.members[1])
      .emit("unread-messages-cleared", data); // Informa aos membros que as mensagens não lidas foram limpas
  });

  // Evento de digitação
  socket.on("typing", (data) => {
    io.to(data.members[0]).to(data.members[1]).emit("started-typing", data); // Informa aos membros que um dos membros está digitando
  });

  // Gerencia usuários online
  socket.on("came-online", (userId) => {
    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId); // Adiciona o usuário à lista de usuários online se ele ainda não estiver na lista
    }

    io.emit("online-users-updated", onlineUsers); // Atualiza a lista de usuários online para todos os sockets
  });

  // Remove o usuário da lista de usuários online quando ele fica offline
  socket.on("went-offline", (userId) => {
    onlineUsers = onlineUsers.filter((user) => user !== userId); // Remove o usuário da lista
    io.emit("online-users-updated", onlineUsers); // Atualiza a lista de usuários online para todos os sockets
  });
});

// Configurações das rotas da API
app.use("/api/users", usersRoute);
app.use("/api/chats", chatsRoute);
app.use("/api/messages", messagesRoute);

const path = require("path");
__dirname = path.resolve();

// Configuração para renderização em produção
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/build"))); // Serve os arquivos estáticos do React
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html")); // Serve o index.html para todas as rotas que não são da API
  });
}

// Inicia o servidor na porta especificada
server.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
