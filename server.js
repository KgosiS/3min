import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = true;

const app = next({ dev });

const handle =
  app.getRequestHandler();

let waitingUsers = [];

app.prepare().then(() => {

  const server = createServer(
    (req, res) => {
      handle(req, res);
    }
  );

  const io = new Server(
    server,
    {
      cors: {
        origin: "*",
      },
    }
  );

  // match score
  const calculateMatchScore = (
    a,
    b
  ) => {

    let score = 0;

    // vibe
    if (a.vibe === b.vibe) {
      score += 50;
    }

    // interests
    const shared =
      a.interests.filter((i) =>
        b.interests.includes(i)
      );

    score +=
      shared.length * 10;

    // age
    if (a.age === b.age) {
      score += 20;
    }

    return score;
  };

  io.on(
    "connection",
    (socket) => {

      console.log(
        "User connected:",
        socket.id
      );

      // online count
      io.emit(
        "online-count",
        io.engine.clientsCount
      );

      // find match
      socket.on(
        "find-match",
        (userData) => {

          const currentUser = {
            socket,
            data: userData,
          };

          let bestMatch =
            null;

          let highestScore = 0;

          waitingUsers.forEach(
            (user) => {

              const score =
                calculateMatchScore(
                  currentUser.data,
                  user.data
                );

              if (
                score >
                highestScore
              ) {
                highestScore =
                  score;

                bestMatch =
                  user;
              }
            }
          );

          // match found
          if (
            bestMatch &&
            highestScore >= 50
          ) {

            waitingUsers =
              waitingUsers.filter(
                (u) =>
                  u.socket.id !==
                  bestMatch.socket.id
              );

            const room =
              `${socket.id}-${bestMatch.socket.id}`;

            socket.join(room);

            bestMatch.socket.join(
              room
            );

            const percentage =
              Math.min(
                highestScore,
                100
              );

            socket.emit(
              "matched",
              {
                room,
                percentage,
                username:
                  bestMatch.data
                    .username ||
                  "Anonymous",
              }
            );

            bestMatch.socket.emit(
              "matched",
              {
                room,
                percentage,
                username:
                  currentUser.data
                    .username ||
                  "Anonymous",
              }
            );

            console.log(
              `Matched with score: ${highestScore}`
            );

          } else {

            waitingUsers.push(
              currentUser
            );
          }
        }
      );

      // send messages
      socket.on(
        "send-message",
        ({
          room,
          message,
        }) => {

          socket
            .to(room)
            .emit(
              "receive-message",
              message
            );
        }
      );

      // typing
      socket.on(
        "typing",
        (room) => {

          socket
            .to(room)
            .emit(
              "user-typing"
            );
        }
      );

      // sync timer
      socket.on(
        "sync-timer",
        ({
          room,
          timeLeft,
        }) => {

          socket
            .to(room)
            .emit(
              "timer-update",
              timeLeft
            );
        }
      );

      // reveal request
      socket.on(
        "request-reveal",
        ({
          room,
          username,
        }) => {

          socket
            .to(room)
            .emit(
              "reveal-request",
              username
            );
        }
      );

      // reveal approved
      socket.on(
        "accept-reveal",
        ({
          room,
          username,
        }) => {

          socket
            .to(room)
            .emit(
              "reveal-approved",
              username
            );
        }
      );

      // skip
      socket.on(
        "skip",
        ({ room }) => {

          socket
            .to(room)
            .emit(
              "partner-skipped"
            );

          waitingUsers =
            waitingUsers.filter(
              (u) =>
                u.socket.id !==
                socket.id
            );

          io.emit(
            "online-count",
            io.engine.clientsCount
          );
        }
      );

      // disconnect
      socket.on(
        "disconnect",
        () => {

          waitingUsers =
            waitingUsers.filter(
              (u) =>
                u.socket.id !==
                socket.id
            );

          io.emit(
            "online-count",
            io.engine.clientsCount
          );

          console.log(
            "User disconnected:",
            socket.id
          );
        }
      );
    }
  );

  server.listen(
    3000,
    () => {

      console.log(
        "Server running on http://localhost:3000"
      );
    }
  );
});