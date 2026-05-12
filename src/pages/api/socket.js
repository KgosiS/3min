import { Server } from "socket.io";

let waitingUser = null;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("find-match", (userData) => {
        if (waitingUser) {
          const partner = waitingUser;
          waitingUser = null;

          socket.emit("matched", { room: socket.id });
          partner.emit("matched", { room: socket.id });

          socket.join(socket.id);
          partner.join(socket.id);
        } else {
          waitingUser = socket;
        }
      });

      socket.on("send-message", ({ room, message }) => {
        socket.to(room).emit("receive-message", message);
      });

      socket.on("disconnect", () => {
        if (waitingUser === socket) {
          waitingUser = null;
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}