const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");

const {
  addUser,
  removeUser,
  getUsersInRoom,
  getUser,
  saveMessage,
  getRoomMessages,
} = require("./utils");

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server).sockets;

dotenv.config();

const PORT = process.env.PORT;

mongoose.connect(
  process.env.MONGO_URI,
  {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  },
  (err) => {
    if (err) return;
    else {
      console.log("Connected to mongo server.");
    }
  }
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.all("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

io.on("connection", (socket) => {
  console.log("New web socket connection");

  socket.on("join-room", ({ username, room }, callback) => {
    setTimeout(() => {
      addUser({
        username,
        room,
        id: socket.id,
      })
        .then(({ user }) => {
          if (user) {
            socket.join(user.room);

            socket.emit(
              "message",
              {
                fromUsername: "Admin",
                message: "Welcome",
                send_at: Date.now(),
              },
              () => {
                console.log("message sent", "Welcome");
              }
            );

            socket.broadcast.to(user.room).emit("message", {
              fromUsername: "Admin",
              message: `${user.username} has joined!`,
              send_at: Date.now(),
            });

            getUsersInRoom(user.room)
              .then(({ users }) => {
                io.to(user.room).emit("all-connected-users", users);
              })
              .catch(({ error }) => console.log(error));

            getRoomMessages(user.room)
              .then(({ messages }) => {
                socket.emit("room-messages", messages);
              })
              .catch(({ error }) => console.log(error));

            callback("user-added", user);
          }
        })
        .catch((error) => {
          callback("error", error);
        });
    }, 250);
  });

  socket.on("sendMessage", ({ message }, callback) => {
    console.log("sendMessage", message);
    getUser(socket.id).then(({ user }) => {
      if (user) {
        const send_at = Date.now();
        saveMessage(user.room, user.username, message, "text", send_at)
          .then(() => {
            io.to(user.room).emit("message", {
              fromUsername: user.username,
              message,
              send_at,
            });
            callback(message);
          })
          .catch(({ error }) => {
            callback(error);
          });
      }
    });
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    getUser(socket.id).then(({ user }) => {
      if (user) {
        const send_at = Date.now();
        saveMessage(
          user.room,
          user.username,
          "https://google.com/maps?q=" + longitude + "," + latitude,
          "location",
          send_at
        )
          .then(() => {
            io.to(user.room).emit("location", {
              fromUsername: user.username,
              location:
                "https://google.com/maps?q=" + longitude + "," + latitude,
              send_at,
            });
            callback(location);
          })
          .catch(({ error }) => {
            callback(error);
          });
      }
    });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id).then(({ user }) => {
      if (user) {
        io.to(user.room).emit("message", {
          fromUsername: "Admin",
          message: user.username + " has left",
          send_at: Date.now(),
        });
        getUsersInRoom(user.room).then(({ users }) => {
          io.to(user.room).emit("all-connected-users", users);
        });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log("Server running at: " + PORT + " " + new Date());
});
