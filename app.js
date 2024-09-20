var CURRENT_ROOM = "";
var totalSeconds = 10;
var currentUser = "";
var room = document.querySelector("#room");
var element = document.querySelector("#offerValue");
var timeSection = document.querySelector("#time-section");
var time = document.querySelector("#time");
var button = document.querySelector("#offerBtn");

const url = "https://localhost:7144/";
const connection = new signalR.HubConnectionBuilder()
  .withUrl(url + "offers")
  .configureLogging(signalR.LogLevel.Information)
  .build();

// SignalR bağlantısı başlatılır
async function start() {
  try {
    await connection.start();
    console.log("SignalR bağlantısı başladı.");

    // Otağın ilkin qiymət məlumatını əldə edirik
    $.get(url + "api/Offer/Room?room=" + CURRENT_ROOM, function (data, status) {
      element.innerHTML = "Begin price " + data + "$";
    });
  } catch (err) {
    console.log(err);
    setTimeout(() => {
      start();
    }, 5000);
  }
}

start(); // Bağlantı yalnız bir dəfə başlatılır

async function JoinRoom(roomName) {
  CURRENT_ROOM = roomName;
  room.style.display = "block";
  currentUser = document.querySelector("#user").value;

  // Join düymələrini gizlət, Leave düyməsini göstər
  document.querySelectorAll("#rooms button").forEach((btn) => {
    btn.style.display = "none";
  });
  document.querySelector("#leaveBtn").style.display = "block";

  await connection.invoke("JoinRoom", CURRENT_ROOM, currentUser);
}

async function LeaveRoom() {
  room.style.display = "block";
  currentUser = document.querySelector("#user").value;

  // Leave Room mesajını göstər
  let infoUser = document.querySelector("#info");
  infoUser.innerHTML = currentUser + " has left the room";

  // Join düymələrini yenidən göstər, Leave düyməsini gizlət
  document.querySelectorAll("#rooms button").forEach((btn) => {
    btn.style.display = "block"; // Join düymələrini geri gətir
  });
  document.querySelector("#leaveBtn").style.display = "none"; // Leave düyməsini gizlət

  // Otaqdan ayrıldıqda vaxtı və təklifi sıfırla
  button.disabled = true;
  timeSection.style.display = "none";
  element.innerHTML = "";
  const element2 = document.querySelector("#offerValue2");
  element2.innerHTML = "";
  clearTimeout(myInterval);

  await connection.invoke("LeaveRoom", CURRENT_ROOM, currentUser);
}

// Digər istifadəçilərdən mesajlar alındıqda işləyən funksiyalar
connection.on("ReceiveJoinInfo", (message) => {
  let infoUser = document.querySelector("#info");
  infoUser.innerHTML = message + " connected to our room";
});

connection.on("ReceiveInfoRoom", (user, data) => {
  const element2 = document.querySelector("#offerValue2");
  element2.innerHTML = user + " offer this price " + data + "$";
  button.disabled = false;
  timeSection.style.display = "none";
  clearTimeout(myInterval);
  totalSeconds = 10;
});

connection.on("ReceiveLeaveInfo", (message) => {
  let infoUser = document.querySelector("#info");
  infoUser.innerHTML = message + " disconnected from our room";
});

connection.on("ReceiveWinInfoRoom", (message, data) => {
  const element2 = document.querySelector("#offerValue2");
  element2.innerHTML = message + " Offer this price " + data + "$";
  button.disabled = true;
  timeSection.style.display = "none";
  clearTimeout(myInterval);
});

var myInterval;

async function IncreaseOffer() {
  clearTimeout(myInterval);
  timeSection.style.display = "block";
  totalSeconds = 10;

  const result = document.querySelector("#user");

  $.get(
    url + `api/Offer/IncreaseRoom?room=${CURRENT_ROOM}&data=100`,
    function (data, status) {
      $.get(
        url + "api/Offer/Room?room=" + CURRENT_ROOM,
        async function (data, status) {
          var element2 = document.querySelector("#offerValue2");
          element2.innerHTML = data;

          await connection.invoke(
            "SendMessageRoom",
            CURRENT_ROOM,
            result.value
          );
          button.disabled = true;

          myInterval = setInterval(async () => {
            time.innerHTML = totalSeconds;

            if (totalSeconds == 0) {
              clearTimeout(myInterval);
              button.disabled = true;
              await connection.invoke(
                "SendWinnerMessageRoom",
                CURRENT_ROOM,
                "Game Over \n " + result.value + " is Winner!"
              );
            }
            --totalSeconds;
          }, 1000);
        }
      );
    }
  );
}
