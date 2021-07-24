const Users = require("./Schemas/Users");
const Messages = require("./Schemas/Messages");

// addUser
const addUser = ({ username, room, id }) =>
  new Promise((resolve, reject) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if (username && room) {
      Users.findOne({ room, username }).then((existingUser) => {
        if (existingUser) {
          reject({
            error: "Username is in use",
          });
          return;
        }
        const user = new Users({ _id: id, username, room });
        user.save();
        resolve({ user });
        return;
      });
    } else {
      reject({
        error: "Username and room are required",
      });
      return;
    }
  });

// removeUser
const removeUser = (id) => {
  return new Promise((resolve, reject) => {
    Users.findByIdAndRemove({ _id: id }, (err, doc, res) => {
      if (err) {
        console.log(err);
        reject({ error: err });
        return;
      } else {
        console.log("removed_user", doc, res);
        resolve({ user: doc });
        return;
      }
    });
  });
};

// getUser
const getUser = (id) => {
  return new Promise((resolve, reject) => {
    Users.findOne({ _id: id }, (err, doc) => {
      if (err) {
        console.log(err);
        reject({ error: err });
        return;
      } else {
        console.log(doc);
        resolve({ user: doc });
        return;
      }
    });
  });
};

// getUsersInRoom
const getUsersInRoom = (room) => {
  return new Promise((resolve, reject) => {
    Users.find({ room }, (err, docs) => {
      if (err) {
        console.log(err);
        reject({ error: err });
        return;
      } else {
        console.log(docs);
        resolve({ users: docs });
        return;
      }
    });
  });
};

const saveMessage = (room, fromUsername, message, type, send_at) => {
  return new Promise((resolve, reject) => {
    try {
      if (!room || !fromUsername || !message || !send_at || !type)
        throw new Error("Required fields are not provided.");
      const msg = new Messages({
        room,
        fromUsername,
        message,
        send_at,
        type,
      });
      msg.save();
      resolve({ message: msg });
      return;
    } catch (e) {
      console.log("error", e);
      reject({ error: e });
      return;
    }
  });
};

const getRoomMessages = (room) => {
  return new Promise((resolve, reject) => {
    Messages.find({ room }, (err, docs) => {
      if (err) {
        console.log(err);
        reject({ error: err });
        return;
      } else {
        console.log("messages", docs);
        resolve({ messages: docs });
        return;
      }
    });
  });
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  saveMessage,
  getRoomMessages,
};
