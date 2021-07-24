const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Users = new Schema({
  _id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("users", Users);
