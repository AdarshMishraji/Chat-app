const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Messages = new Schema({
  room: {
    type: String,
    required: true,
  },
  fromUsername: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  send_at: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("messages", Messages);
