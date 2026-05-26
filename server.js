import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "https://chat-app-sand-eta.vercel.app/";
const port = 443;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);
  const users = new Map(); // ユーザー情報を保存

  io.on("connection", (socket) => {
    console.log('接続しました:', socket.id);
    
    socket.on("login", (data) => {
      users.set(socket.id, { name: data.name });
      console.log('ログイン:', data.name, socket.id);
      io.emit("user_joined", { name: data.name });
    });
    
    socket.on("message", (data) => {
      const user = users.get(socket.id);
      const messageData = {
        id: Math.random().toString(36).substr(2, 9),
        text: data.text,
        userName: user?.name || "Unknown",
        userId: socket.id,
        timestamp: new Date(),
      };
      console.log('メッセージ受信:', messageData);
      io.emit("message", messageData);
    });

    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      console.log('接続終了:', socket.id);
      users.delete(socket.id);
      if (user) {
        io.emit("user_left", { name: user.name });
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://chat-app-sand-eta.vercel.app/`);
    });
});