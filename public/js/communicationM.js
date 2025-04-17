// Підключення до сервера Socket.io
const socket = io("http://localhost:3009");

// DOM елементи
const usersList = document.getElementById("users-list");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const attachBtn = document.getElementById("attach-btn");
const voiceBtn = document.getElementById("voice-btn");
const videoBtn = document.getElementById("video-btn");
const callBtn = document.getElementById("call-btn");
const videoCallBtn = document.getElementById("video-call-btn");
const currentUserName = document.getElementById("current-user-name");
const currentUserStatus = document.getElementById("current-user-status");
const currentUserImg = document.getElementById("current-user-img");
const masterName = document.getElementById("master-name");
const masterStatus = document.getElementById("master-status");

// Елементи медіа рекордера
const mediaRecorder = document.getElementById("media-recorder");
const recorderTitle = document.getElementById("recorder-title");
const closeRecorder = document.getElementById("close-recorder");
const startRecording = document.getElementById("start-recording");
const stopRecording = document.getElementById("stop-recording");
const sendRecording = document.getElementById("send-recording");
const recorderTimer = document.getElementById("recorder-timer");
const visualizer = document.getElementById("visualizer");

// Елементи для дзвінків
const callModal = document.getElementById("call-modal");
const callerImg = document.getElementById("caller-img");
const callerName = document.getElementById("caller-name");
const callTypeText = document.getElementById("call-type");
const declineCall = document.getElementById("decline-call");
const acceptCall = document.getElementById("accept-call");

const activeCall = document.getElementById("active-call");
const activeCallTitle = document.getElementById("active-call-title");
const activeCallUser = document.getElementById("active-call-user");
const callDuration = document.getElementById("call-duration");

const videoContainer = document.getElementById("video-container");
const audioCallUi = document.getElementById("audio-call-ui");
const audioCallImg = document.getElementById("audio-call-img");
const audioCallName = document.getElementById("audio-call-name");

const toggleMute = document.getElementById("toggle-mute");
const toggleVideo = document.getElementById("toggle-video");
const endCall = document.getElementById("end-call");

const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");

// Дані користувача (майстра)
let currentUser = {
  id: "master_" + Math.random().toString(36).substr(2, 9),
  username: "Майстер",
  role: "master",
  avatar: "https://via.placeholder.com/50"
};

// Дані активного чату
let activeChat = null;
let activeUsers = [];
let messages = {}; // Формат: {chatId: [ {sender, text, time}, ... ]}

// Медіа змінні
let mediaRecorderObj = null;
let recordedChunks = [];
let recordingType = null; // "audio" або "video"
let recordingTimer = null;
let recordingDuration = 0;

let audioContext = null;
let analyser = null;
let visualizerContext = null;

// Змінні для дзвінків
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let callActive = false;
let callType = "audio"; // "audio" або "video"
let callTimer = null;
let callDurationTime = 0;

// Ініціалізація
function init() {
  // Отримання імені майстра з localStorage або використання значення за замовчуванням
  const storedName = localStorage.getItem("masterName");
  if (storedName) {
    currentUser.username = storedName;
    masterName.textContent = storedName;
  }

  // Приєднання до чату
  socket.emit("join", currentUser);

  // Завантаження тестових користувачів (в реальному додатку це буде з сервера)
  loadTestUsers();

  // Налаштування обробників подій
  setupEventListeners();
}

// Завантаження тестових користувачів
function loadTestUsers() {
  const testUsers = [
    {
      id: "user_1",
      username: "Іван Петренко",
      lastMessage: "Доброго дня! Коли ви зможете приїхати?",
      time: "10:30",
      unread: 2,
      avatar: "https://via.placeholder.com/40",
      status: "online",
    },
    {
      id: "user_2",
      username: "Марія Коваленко",
      lastMessage: "Дякую за швидку відповідь!",
      time: "09:15",
      unread: 0,
      avatar: "https://via.placeholder.com/40",
      status: "offline",
    },
    {
      id: "user_3",
      username: "Олександр Шевченко",
      lastMessage: "Потрібна консультація щодо ремонту",
      time: "Вчора",
      unread: 1,
      avatar: "https://via.placeholder.com/40",
      status: "online",
    },
  ];

  activeUsers = testUsers;
  renderUsersList();
}

// Відображення списку користувачів
function renderUsersList() {
  usersList.innerHTML = "";

  activeUsers.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.className = `user-item ${
      activeChat && activeChat.id === user.id ? "active" : ""
    }`;
    userItem.dataset.userId = user.id;

    userItem.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}">
            <div class="user-item-info">
                <h4>${user.username}</h4>
                <p>${user.lastMessage || "Немає повідомлень"}</p>
            </div>
            <div class="user-item-meta">
                <span class="user-item-time">${user.time || ""}</span>
                ${
                  user.unread > 0
                    ? `<span class="user-item-badge">${user.unread}</span>`
                    : ""
                }
            </div>
        `;

    userItem.addEventListener("click", () => selectUser(user));
    usersList.appendChild(userItem);
  });
}

// Вибір користувача для чату
function selectUser(user) {
  activeChat = user;

  // Оновлення інтерфейсу
  currentUserName.textContent = user.username;
  currentUserStatus.textContent =
    user.status === "online" ? "Онлайн" : "Офлайн";
  currentUserImg.src = user.avatar;

  // Активація елементів інтерфейсу
  messageInput.disabled = false;
  sendBtn.disabled = false;
  callBtn.disabled = false;
  videoCallBtn.disabled = false;

  // Завантаження повідомлень
  loadMessages(user.id);

  // Оновлення списку користувачів
  renderUsersList();

  // Скидання лічильника непрочитаних повідомлень
  const userIndex = activeUsers.findIndex((u) => u.id === user.id);
  if (userIndex !== -1) {
    activeUsers[userIndex].unread = 0;
  }
}

// Завантаження повідомлень
function loadMessages(userId) {
  // Перевірка, чи є повідомлення для цього користувача
  if (!messages[userId]) {
    messages[userId] = [];
  }

  // Відображення повідомлень
  renderMessages(userId);
}

// Відображення повідомлень
function renderMessages(userId) {
  chatMessages.innerHTML = "";

  if (!messages[userId] || messages[userId].length === 0) {
    chatMessages.innerHTML = `
            <div class="no-messages">
                <p>Немає повідомлень. Почніть розмову!</p>
            </div>
        `;
    return;
  }

  messages[userId].forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${
      msg.sender === currentUser.id ? "sent" : "received"
    }`;

    let content = "";

    if (msg.type === "text") {
      content = `<div class="message-content">${msg.content}</div>`;
    } else if (msg.type === "voice") {
      content = `
                <div class="media-message">
                    <audio controls src="${msg.content}"></audio>
                </div>
            `;
    } else if (msg.type === "video") {
      content = `
                <div class="media-message">
                    <video controls src="${msg.content}"></video>
                </div>
            `;
    }

    messageDiv.innerHTML = `
            ${content}
            <div class="message-time">${msg.time}</div>
        `;

    chatMessages.appendChild(messageDiv);
  });

  // Прокрутка до останнього повідомлення
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Надсилання текстового повідомлення
function sendTextMessage() {
  const text = messageInput.value.trim();

  if (!text || !activeChat) return;

  const message = {
    id: generateId(),
    sender: currentUser.id,
    receiver: activeChat.id,
    type: "text",
    content: text,
    time: getCurrentTime(),
    read: false,
  };

  // Додавання повідомлення до локального сховища
  if (!messages[activeChat.id]) {
    messages[activeChat.id] = [];
  }

  messages[activeChat.id].push(message);

  // Відображення повідомлень
  renderMessages(activeChat.id);

  // Очищення поля вводу
  messageInput.value = "";

  // Надсилання повідомлення через сокет
  socket.emit("message", {
    ...message,
    username: currentUser.username,
  });

  // Оновлення останнього повідомлення в списку користувачів
  updateLastMessage(activeChat.id, text);
}

// Оновлення останнього повідомлення в списку користувачів
function updateLastMessage(userId, text) {
  const userIndex = activeUsers.findIndex((u) => u.id === userId);

  if (userIndex !== -1) {
    activeUsers[userIndex].lastMessage = text;
    activeUsers[userIndex].time = getCurrentTime();
    renderUsersList();
  }
}

// Отримання поточного часу
function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// Генерація унікального ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Запис голосового повідомлення
function startVoiceRecording() {
  recordingType = "voice";
  recorderTitle.textContent = "Запис голосового повідомлення";
  mediaRecorder.style.display = "block";

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      setupMediaRecorder(stream);
      setupAudioVisualizer(stream);
      startRecordingTimer();
    })
    .catch((error) => {
      console.error("Помилка доступу до мікрофона:", error);
      alert("Не вдалося отримати доступ до мікрофона");
      closeMediaRecorder();
    });
}

// Запис відео повідомлення
function startVideoRecording() {
  recordingType = "video";
  recorderTitle.textContent = "Запис відео повідомлення";
  mediaRecorder.style.display = "block";

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((stream) => {
      setupMediaRecorder(stream);
      startRecordingTimer();
    })
    .catch((error) => {
      console.error("Помилка доступу до камери:", error);
      alert("Не вдалося отримати доступ до камери");
      closeMediaRecorder();
    });
}

// Налаштування медіа рекордера
function setupMediaRecorder(stream) {
  mediaRecorderObj = new MediaRecorder(stream);

  mediaRecorderObj.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorderObj.onstop = () => {
    const blob = new Blob(recordedChunks, {
      type: recordingType === "voice" ? "audio/webm" : "video/webm",
    });

    const url = URL.createObjectURL(blob);

    // Зберігання URL для подальшого надсилання
    mediaRecorderObj.recordedUrl = url;

    // Зупинка таймера
    stopRecordingTimer();

    // Активація кнопки надсилання
    sendRecording.disabled = false;

    // Зупинка всіх треків
    stream.getTracks().forEach((track) => track.stop());
  };
}

// Налаштування візуалізатора аудіо
function setupAudioVisualizer(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  visualizerContext = visualizer.getContext("2d");
  visualizer.width = visualizer.clientWidth;
  visualizer.height = visualizer.clientHeight;

  function draw() {
    if (!audioContext || !analyser) return;

    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    visualizerContext.fillStyle = "#f8f9fa";
    visualizerContext.fillRect(0, 0, visualizer.width, visualizer.height);

    const barWidth = (visualizer.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;

      visualizerContext.fillStyle = `rgb(0, 123, 255)`;
      visualizerContext.fillRect(
        x,
        visualizer.height - barHeight,
        barWidth,
        barHeight
      );

      x += barWidth + 1;
    }
  }

  draw();
}

// Запуск таймера запису
function startRecordingTimer() {
  recordingDuration = 0;
  updateRecordingTimer();

  recordingTimer = setInterval(() => {
    recordingDuration++;
    updateRecordingTimer();

    // Обмеження тривалості запису (3 хвилини)
    if (recordingDuration >= 180) {
      stopRecording();
    }
  }, 1000);
}

// Оновлення відображення таймера
function updateRecordingTimer() {
  const minutes = Math.floor(recordingDuration / 60);
  const seconds = recordingDuration % 60;
  recorderTimer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Зупинка таймера запису
function stopRecordingTimer() {
  clearInterval(recordingTimer);
}

// Закриття медіа рекордера
function closeMediaRecorder() {
  mediaRecorder.style.display = "none";

  if (mediaRecorderObj && mediaRecorderObj.state === "recording") {
    mediaRecorderObj.stop();
  }

  // Скидання змінних
  recordedChunks = [];
  recordingType = null;

  // Зупинка таймера
  stopRecordingTimer();

  // Скидання кнопок
  startRecording.disabled = false;
  stopRecording.disabled = true;
  sendRecording.disabled = true;

  // Закриття аудіо контексту
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    analyser = null;
  }
}

// Надсилання записаного медіа
function sendRecordedMedia() {
  if (!mediaRecorderObj || !mediaRecorderObj.recordedUrl || !activeChat) return;

  const message = {
    id: generateId(),
    sender: currentUser.id,
    receiver: activeChat.id,
    type: recordingType,
    content: mediaRecorderObj.recordedUrl,
    time: getCurrentTime(),
    read: false,
  };

  // Додавання повідомлення до локального сховища
  if (!messages[activeChat.id]) {
    messages[activeChat.id] = [];
  }

  messages[activeChat.id].push(message);

  // Відображення повідомлень
  renderMessages(activeChat.id);

  // Надсилання повідомлення через сокет
  socket.emit("message", {
    ...message,
    username: currentUser.username,
  });

  // Оновлення останнього повідомлення в списку користувачів
  updateLastMessage(
    activeChat.id,
    `${recordingType === "voice" ? "Голосове" : "Відео"} повідомлення`
  );

  // Закриття медіа рекордера
  closeMediaRecorder();
}

// Ініціювання дзвінка
function initiateCall(isVideo) {
  if (!activeChat) return;

  callType = isVideo ? "video" : "audio";

  // В реальному додатку тут буде логіка для встановлення WebRTC з'єднання
  // Для демонстрації просто показуємо активний дзвінок

  showActiveCall(activeChat, callType);

  // Надсилання події через сокет
  socket.emit("call", {
    caller: currentUser,
    receiver: activeChat.id,
    type: callType,
  });
}

// Показ активного дзвінка
function showActiveCall(user, type) {
  callActive = true;

  // Налаштування інтерфейсу
  activeCallTitle.textContent = `Дзвінок з`;
  activeCallUser.textContent = user.username;

  if (type === "audio") {
    videoContainer.style.display = "none";
    audioCallUi.style.display = "flex";
    audioCallImg.src = user.avatar;
    audioCallName.textContent = user.username;
    toggleVideo.style.display = "none";
  } else {
    videoContainer.style.display = "block";
    audioCallUi.style.display = "none";
    toggleVideo.style.display = "block";

    // Запит доступу до камери
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch((error) => {
        console.error("Помилка доступу до камери:", error);
        alert("Не вдалося отримати доступ до камери");
        endCurrentCall();
      });
  }

  // Показ інтерфейсу дзвінка
  activeCall.style.display = "flex";

  // Запуск таймера дзвінка
  startCallTimer();
}

// Запуск таймера дзвінка
function startCallTimer() {
  callDurationTime = 0;
  updateCallDuration();

  callTimer = setInterval(() => {
    callDurationTime++;
    updateCallDuration();
  }, 1000);
}

// Оновлення відображення тривалості дзвінка
function updateCallDuration() {
  const minutes = Math.floor(callDurationTime / 60);
  const seconds = callDurationTime % 60;
  callDuration.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Завершення поточного дзвінка
function endCurrentCall() {
  callActive = false;

  // Зупинка таймера
  clearInterval(callTimer);

  // Зупинка медіа потоків
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteStream = null;
  }

  // Закриття з'єднання
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Приховування інтерфейсу дзвінка
  activeCall.style.display = "none";

  // Надсилання події через сокет
  socket.emit("end-call", {
    caller: currentUser.id,
    receiver: activeChat ? activeChat.id : null,
  });
}

// Налаштування обробників подій
function setupEventListeners() {
  // Надсилання повідомлення
  sendBtn.addEventListener("click", sendTextMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendTextMessage();
    }
  });

  // Запис голосового повідомлення
  voiceBtn.addEventListener("click", () => {
    if (!activeChat) return;
    startVoiceRecording();
  });

  // Запис відео повідомлення
  videoBtn.addEventListener("click", () => {
    if (!activeChat) return;
    startVideoRecording();
  });

  // Керування медіа рекордером
  closeRecorder.addEventListener("click", closeMediaRecorder);

  startRecording.addEventListener("click", () => {
    if (!mediaRecorderObj) return;

    mediaRecorderObj.start();
    startRecording.disabled = true;
    stopRecording.disabled = false;
  });

  stopRecording.addEventListener("click", () => {
    if (!mediaRecorderObj || mediaRecorderObj.state !== "recording") return;

    mediaRecorderObj.stop();
    stopRecording.disabled = true;
  });

  sendRecording.addEventListener("click", sendRecordedMedia);

  // Дзвінки
  callBtn.addEventListener("click", () => initiateCall(false));
  videoCallBtn.addEventListener("click", () => initiateCall(true));

  declineCall.addEventListener("click", () => {
    callModal.style.display = "none";
  });

  acceptCall.addEventListener("click", () => {
    const caller = {
      id: callModal.dataset.callerId,
      username: callerName.textContent,
      avatar: callerImg.src,
    };

    callModal.style.display = "none";
    showActiveCall(caller, callModal.dataset.callType);
  });

  endCall.addEventListener("click", endCurrentCall);

  toggleMute.addEventListener("click", () => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const isEnabled = audioTracks[0].enabled;
    audioTracks[0].enabled = !isEnabled;

    toggleMute.innerHTML = isEnabled
      ? '<i class="fas fa-microphone-slash"></i>'
      : '<i class="fas fa-microphone"></i>';
  });

  toggleVideo.addEventListener("click", () => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const isEnabled = videoTracks[0].enabled;
    videoTracks[0].enabled = !isEnabled;

    toggleVideo.innerHTML = isEnabled
      ? '<i class="fas fa-video-slash"></i>'
      : '<i class="fas fa-video"></i>';
  });

  // Socket.io події
  socket.on("message", (message) => {
    // Перевірка, чи повідомлення призначене для поточного користувача
    if (message.receiver === currentUser.id) {
      const senderId = message.sender;

      // Додавання повідомлення до локального сховища
      if (!messages[senderId]) {
        messages[senderId] = [];
      }

      messages[senderId].push(message);

      // Якщо відкритий чат з відправником, відображаємо повідомлення
      if (activeChat && activeChat.id === senderId) {
        renderMessages(senderId);
      } else {
        // Інакше збільшуємо лічильник непрочитаних повідомлень
        const userIndex = activeUsers.findIndex((u) => u.id === senderId);
        if (userIndex !== -1) {
          activeUsers[userIndex].unread =
            (activeUsers[userIndex].unread || 0) + 1;
          activeUsers[userIndex].lastMessage =
            message.type === "text"
              ? message.content
              : `${
                  message.type === "voice" ? "Голосове" : "Відео"
                } повідомлення`;
          activeUsers[userIndex].time = message.time;
          renderUsersList();
        }
      }
    }
  });

  socket.on("user-joined", (user) => {
    // Додавання нового користувача до списку
    if (
      user.id !== currentUser.id &&
      !activeUsers.some((u) => u.id === user.id)
    ) {
      activeUsers.push({
        id: user.id,
        username: user.username,
        avatar: user.avatar || "https://via.placeholder.com/40",
        status: "online",
        lastMessage: "",
        time: getCurrentTime(),
        unread: 0,
      });
      renderUsersList();
    }
  });

  socket.on("user-left", (user) => {
    // Оновлення статусу користувача
    const userIndex = activeUsers.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      activeUsers[userIndex].status = "offline";
      renderUsersList();
    }
  });

  socket.on("call", (callData) => {
    // Показ модального вікна для вхідного дзвінка
    callerImg.src = callData.caller.avatar || "https://via.placeholder.com/80";
    callerName.textContent = callData.caller.username;
    callType.textContent =
      callData.type === "video" ? "Відео дзвінок" : "Аудіо дзвінок";

    callModal.dataset.callerId = callData.caller.id;
    callModal.dataset.callType = callData.type;

    callModal.style.display = "flex";
  });

  socket.on("end-call", () => {
    // Завершення дзвінка
    if (callActive) {
      endCurrentCall();
    }
  });
}

// Запуск додатку
init();
