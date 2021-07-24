const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageInput = document.querySelector("#message-input");
const $messageFormButton = document.querySelector("#send-btn");
const $shareLocationButton = document.querySelector("#share-location");
const $messages = document.querySelector("#messages");

const adminMessageTemplate = document.querySelector(
  "#admin-message-template"
).innerHTML;
const myMessageTemplate = document.querySelector(
  "#my-message-template"
).innerHTML;
const othersMessageTemplate = document.querySelector(
  "#others-message-template"
).innerHTML;
const myMessageLocationTemplate = document.querySelector(
  "#my-location-message-template"
).innerHTML;
const othersMessageLocationTemplate = document.querySelector(
  "#others-location-message-template"
).innerHTML;
const sideBarTemplete = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const getDesiredDate = (timestamp) => {
  return moment(timestamp).format("Do of MMM YYYY, hh:mm a");
};

$messageInput.focus();

socket.on("message", ({ message, send_at, fromUsername }, callback) => {
  console.log(message);
  callback ? callback() : null;
  let html;
  if (fromUsername === "Admin") {
    html = Mustache.render(adminMessageTemplate, {
      fromUsername,
      message,
      send_at: getDesiredDate(send_at),
    });
  } else if (fromUsername === username) {
    html = Mustache.render(myMessageTemplate, {
      fromUsername,
      message,
      send_at: getDesiredDate(send_at),
    });
  } else {
    html = Mustache.render(othersMessageTemplate, {
      fromUsername,
      message,
      send_at: getDesiredDate(send_at),
    });
  }
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("location", ({ location, send_at, fromUsername }) => {
  console.log("location");
  let html;
  if (fromUsername === username) {
    html = Mustache.render(myMessageLocationTemplate, {
      fromUsername,
      location,
      linkName: "My Current Location",
      send_at: getDesiredDate(send_at),
    });
  } else {
    html = Mustache.render(othersMessageLocationTemplate, {
      fromUsername,
      location,
      linkName: "My Current Location",
      send_at: getDesiredDate(send_at),
    });
  }
  $messages.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = $messageInput.value;
  socket.emit("sendMessage", { message }, (resMsg) => {
    console.log("message response", resMsg);
    $messageInput.value = "";
    $messageInput.focus();
    $messageFormButton.removeAttribute("disabled");
  });
});

$shareLocationButton.addEventListener("click", () => {
  if (navigator.geolocation) {
    $shareLocationButton.setAttribute("disabled", "disabled");
    console.log("supported");
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("sendLocation", { latitude, longitude }, (resMsg) => {
        console.log("location response", resMsg);
        $shareLocationButton.removeAttribute("disabled");
      });
    });
  } else {
    return alert("Geolocation not supported.");
  }
});

socket.on("all-connected-users", (users) => {
  const html = Mustache.render(sideBarTemplete, {
    room,
    users,
  });
  document.querySelector(".chat__sidebar").innerHTML = html;
});

socket.on("room-messages", (messages) => {
  console.log("all messages", messages);
  messages.forEach((message) => {
    let html;
    if (message.fromUsername === username) {
      if (message.type === "location") {
        html = Mustache.render(myMessageLocationTemplate, {
          fromUsername: message.fromUsername,
          location: message.location,
          linkName: "My Current Location",
          send_at: getDesiredDate(message.send_at),
        });
      } else {
        html = Mustache.render(myMessageTemplate, {
          fromUsername: message.fromUsername,
          message: message.message,
          send_at: getDesiredDate(message.send_at),
        });
      }
    } else {
      if (message.type === "location") {
        html = Mustache.render(othersMessageLocationTemplate, {
          fromUsername: message.fromUsername,
          location: message.location,
          linkName: "My Current Location",
          send_at: getDesiredDate(message.send_at),
        });
      } else {
        html = Mustache.render(othersMessageTemplate, {
          fromUsername: message.fromUsername,
          message: message.message,
          send_at: getDesiredDate(message.send_at),
        });
      }
    }
    $messages.insertAdjacentHTML("beforeend", html);
  });
});

socket.emit(
  "join-room",
  {
    username,
    room,
  },
  (resText, resObj) => {
    if (resText === "user-added") {
      console.log("user-added", resObj);
    } else if (resText === "error") {
      console.log("error", resObj);
      alert("Error." + "\n" + "Reason: " + resObj.error);
      location.href = "/";
    }
  }
);
