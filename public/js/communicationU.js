// Підключення до сервера Socket.io
const socket = io("http://localhost:3009");

// DOM елементи
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const attachBtn = document.getElementById("attach-btn");
const voiceBtn = document.getElementById("voice-btn");
const videoBtn = document.getElementById("video-btn");
const callBtn = document.getElementById("call-btn");
const videoCallBtn = document.getElementById("video-call-btn");
const masterName = document.getElementById("master-name");
const masterStatus = document.getElementById("master-status");
const masterImg = document.getElementById("master-img");

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

// Дані користувача
let currentUser = {
  id: "user_" + Math.random().toString(36).substr(2, 9),
  username: "Користувач",
  role: "user",
  avatar: "https://via.placeholder.com/50",
};

// Дані майстра
let master = {
  id: "master_1",
  username: "Майстер",
  role: "master",
  avatar: "https://via.placeholder.com/50",
  status: "online",
};

// Повідомлення
let messages = [];

// Медіа змінні
let mediaRecorderObj = null;
let recordedChunks = [];
let recordingType = null;
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
let callType = "audio"; 
let callTimer = null;
let callDurationTime = 0;

// Ініціалізація
function init() {
  // Отримання імені користувача з localStorage або використання значення за замовчуванням
  const storedName = localStorage.getItem("userName");
  if (storedName) {
    currentUser.username = storedName;
  }

  // Отримання ID користувача з URL параметрів або localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");
  if (userId) {
    currentUser.id = userId;
    localStorage.setItem("userId", userId);
  } else {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      currentUser.id = storedUserId;
    }
  }

  // Отримання ID майстра з URL параметрів або localStorage
  const masterId = urlParams.get("masterId");
  if (masterId) {
    master.id = masterId;
    localStorage.setItem("masterId", masterId);

    // Отримання інформації про майстра з сервера
    fetchMasterInfo(masterId);
  } else {
    const storedMasterId = localStorage.getItem("masterId");
    if (storedMasterId) {
      master.id = storedMasterId;
      fetchMasterInfo(storedMasterId);
    }
  }

  // Приєднання до чату
  socket.emit("join", currentUser);

  // Налаштування обробників подій
  setupEventListeners();

  // Завантаження історії повідомлень
  loadChatHistory();
}

// Отримання інформації про майстра з сервера
function fetchMasterInfo(masterId) {
  fetch(`/api/masters/${masterId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не вдалося отримати інформацію про майстра");
      }
      return response.json();
    })
    .then((data) => {
      master.username = data.username;
      if (data.first_name && data.last_name) {
        master.username = `${data.first_name} ${data.last_name}`;
      }
      master.status = data.online ? "online" : "offline";

      // Оновлення інтерфейсу
      masterName.textContent = master.username;
      masterStatus.textContent =
        master.status === "online" ? "Онлайн" : "Офлайн";
      masterStatus.className = master.status;

      if (data.avatar) {
        master.avatar = data.avatar;
        masterImg.src = data.avatar;
      }
    })
    .catch((error) => {
      console.error("Помилка при отриманні інформації про майстра:", error);
      // Використовуємо значення за замовчуванням
      masterName.textContent = master.username;
      masterStatus.textContent = "Онлайн";
      masterStatus.className = "online";
    });
}

// Завантаження історії повідомлень
function loadChatHistory() {
  // Перевірка, чи є ID користувача та майстра
  if (!currentUser.id || !master.id) {
    console.warn(
      "Не вдалося завантажити історію чату: відсутні ID користувача або майстра"
    );
    loadTestMessages();
    return;
  }

  fetch(`/api/chat/history?userId=${currentUser.id}&masterId=${master.id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не вдалося завантажити історію чату");
      }
      return response.json();
    })
    .then((data) => {
      if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
        renderMessages();
      } else {
        loadTestMessages();
      }
    })
    .catch((error) => {
      console.error("Помилка при завантаженні історії чату:", error);
      // Завантаження тестових повідомлень, якщо не вдалося отримати історію
      loadTestMessages();
    });
}

// Завантаження тестових повідомлень
function loadTestMessages() {
  messages = [
    {
      id: "msg1",
      sender: master.id,
      receiver: currentUser.id,
      type: "text",
      content: "Доброго дня! Чим я можу вам допомогти?",
      time: "10:30",
      read: true,
    },
    {
      id: "msg2",
      sender: currentUser.id,
      receiver: master.id,
      type: "text",
      content: "Доброго дня! Мені потрібна консультація щодо ремонту.",
      time: "10:32",
      read: true,
    },
    {
      id: "msg3",
      sender: master.id,
      receiver: currentUser.id,
      type: "text",
      content:
        "Звичайно, я готовий допомогти. Розкажіть детальніше про вашу проблему.",
      time: "10:33",
      read: true,
    },
  ];

  renderMessages();
}

// Відображення повідомлень
function renderMessages() {
  chatMessages.innerHTML = "";

  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="no-messages">
        <i class="fas fa-comments" style="font-size: 48px; color: #0a2463;"></i>
        <p>Немає повідомлень. Почніть розмову!</p>
      </div>
    `;
    return;
  }

  messages.forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${
      msg.sender === currentUser.id ? "sent" : "received"
    }`;
    messageDiv.dataset.id = msg.id;

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
    } else if (msg.type === "file") {
      content = `
        <div class="file-message">
          <a href="${msg.content}" target="_blank" download>
            <i class="fas fa-file"></i> ${
              msg.fileName || "Завантажити файл"
            }
          </a>
        </div>
      `;
    } else if (msg.type === "image") {
      content = `
        <div class="image-message">
          <img src="${msg.content}" alt="Зображення" />
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

  // Позначення повідомлень як прочитаних
  markMessagesAsRead();
}

// Позначення повідомлень як прочитаних
function markMessagesAsRead() {
  const unreadMessages = messages.filter(
    (msg) => msg.sender === master.id && !msg.read
  );

  if (unreadMessages.length === 0) return;

  // Позначення повідомлень як прочитаних локально
  unreadMessages.forEach((msg) => {
    msg.read = true;
  });

  // Відправка запиту на сервер для позначення повідомлень як прочитаних
  const messageIds = unreadMessages.map((msg) => msg.id);

  fetch("/api/chat/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageIds,
      userId: currentUser.id,
      masterId: master.id,
    }),
  }).catch((error) => {
    console.error("Помилка при позначенні повідомлень як прочитаних:", error);
  });
}

// Надсилання текстового повідомлення
function sendTextMessage() {
  const text = messageInput.value.trim();

  if (!text) return;

  const message = {
    id: generateId(),
    sender: currentUser.id,
    receiver: master.id,
    type: "text",
    content: text,
    time: getCurrentTime(),
    read: false,
  };

  // Додавання повідомлення до масиву
  messages.push(message);

  // Відображення повідомлень
  renderMessages();

  // Очищення поля вводу
  messageInput.value = "";

  // Надсилання повідомлення через сокет
  socket.emit("message", {
    ...message,
    username: currentUser.username,
  });

  // Збереження повідомлення на сервері
  saveMessageToServer(message);
}

// Збереження повідомлення на сервері
function saveMessageToServer(message) {
  fetch("/api/chat/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...message,
      username: currentUser.username,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не вдалося зберегти повідомлення");
      }
      return response.json();
    })
    .then((data) => {
      // Оновлення ID повідомлення, якщо сервер повернув новий ID
      if (data.id) {
        const messageIndex = messages.findIndex((msg) => msg.id === message.id);
        if (messageIndex !== -1) {
          messages[messageIndex].id = data.id;
        }
      }
    })
    .catch((error) => {
      console.error("Помилка при збереженні повідомлення:", error);
    });
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
  return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
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

      // Відображення відео в реальному часі
      const videoPreview = document.createElement("video");
      videoPreview.srcObject = stream;
      videoPreview.autoplay = true;
      videoPreview.muted = true;
      videoPreview.className = "video-preview";

      const recorderVisualization = document.querySelector(
        ".recorder-visualization"
      );
      recorderVisualization.innerHTML = "";
      recorderVisualization.appendChild(videoPreview);

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
  const options = {
    mimeType: recordingType === "voice" ? "audio/webm" : "video/webm",
  };

  try {
    mediaRecorderObj = new MediaRecorder(stream, options);
  } catch (e) {
    console.error(
      "Не підтримується формат WebM, використовуємо стандартний формат:",
      e
    );
    mediaRecorderObj = new MediaRecorder(stream);
  }

  recordedChunks = [];

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
    mediaRecorderObj.recordedBlob = blob;

    // Зупинка таймера
    stopRecordingTimer();

    // Активація кнопки надсилання
    sendRecording.disabled = false;

    // Відображення попереднього перегляду запису
    const recorderVisualization = document.querySelector(
      ".recorder-visualization"
    );

    if (recordingType === "voice") {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      recorderVisualization.innerHTML = "";
      recorderVisualization.appendChild(audio);
    } else if (recordingType === "video") {
      const video = document.querySelector(".video-preview");
      if (video) {
        video.srcObject = null;
        video.src = url;
        video.controls = true;
        video.muted = false;
      }
    }
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

      visualizerContext.fillStyle = `rgb(10, 36, 99)`;
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

  // Очищення візуалізатора
  const recorderVisualization = document.querySelector(
    ".recorder-visualization"
  );
  recorderVisualization.innerHTML = "";

  // Відновлення стандартного вигляду візуалізатора
  visualizer.width = visualizer.clientWidth;
  visualizer.height = visualizer.clientHeight;
  visualizerContext = visualizer.getContext("2d");
  visualizerContext.fillStyle = "#f8f9fa";
  visualizerContext.fillRect(0, 0, visualizer.width, visualizer.height);
}

// Надсилання записаного медіа
function sendRecordedMedia() {
  if (!mediaRecorderObj || !mediaRecorderObj.recordedBlob) return;

  // Створення FormData для відправки файлу на сервер
  const formData = new FormData();
  formData.append(
    "file",
    mediaRecorderObj.recordedBlob,
    `${recordingType}_${Date.now()}.webm`
  );
  formData.append("type", recordingType);
  formData.append("senderId", currentUser.id);
  formData.append("receiverId", master.id);

  // Відправка файлу на сервер
  fetch("/api/chat/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не вдалося завантажити файл");
      }
      return response.json();
    })
    .then((data) => {
      // Створення повідомлення з посиланням на завантажений файл
      const message = {
        id: generateId(),
        sender: currentUser.id,
        receiver: master.id,
        type: recordingType,
        content: data.fileUrl,
        time: getCurrentTime(),
        read: false,
      };

      // Додавання повідомлення до масиву
      messages.push(message);

      // Відображення повідомлень
      renderMessages();

      // Надсилання повідомлення через сокет
      socket.emit("message", {
        ...message,
        username: currentUser.username,
      });

      // Закриття медіа рекордера
      closeMediaRecorder();
    })
    .catch((error) => {
      console.error("Помилка при завантаженні файлу:", error);
      alert("Не вдалося завантажити файл. Спробуйте ще раз.");

      // Використання локального URL як запасний варіант
      const message = {
        id: generateId(),
        sender: currentUser.id,
        receiver: master.id,
        type: recordingType,
        content: mediaRecorderObj.recordedUrl,
        time: getCurrentTime(),
        read: false,
      };

      // Додавання повідомлення до масиву
      messages.push(message);

      // Відображення повідомлень
      renderMessages();

      // Надсилання повідомлення через сокет
      socket.emit("message", {
        ...message,
        username: currentUser.username,
      });

      // Закриття медіа рекордера
      closeMediaRecorder();
    });
}

// Ініціювання дзвінка
function initiateCall(isVideo) {
  callType = isVideo ? "video" : "audio";

  // Перевірка статусу майстра
  if (master.status !== "online") {
    alert("Майстер зараз не в мережі. Спробуйте пізніше.");
    return;
  }

  // Запит доступу до медіа пристроїв
  const constraints = {
    audio: true,
    video: isVideo,
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      localStream = stream;

      // Створення RTCPeerConnection
      createPeerConnection();

      // Додавання локальних треків до з'єднання
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      // Створення пропозиції (offer)
      return peerConnection.createOffer();
    })
    .then((offer) => {
      // Встановлення локального опису
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      // Відправка пропозиції через сокет
      socket.emit("call-offer", {
        caller: currentUser,
        receiver: master.id,
        type: callType,
        sdp: peerConnection.localDescription,
      });

      // Показ інтерфейсу дзвінка
      showActiveCall(master, callType);
    })
    .catch((error) => {
      console.error("Помилка при ініціюванні дзвінка:", error);
      alert(
        "Не вдалося ініціювати дзвінок. Перевірте доступ до камери та мікрофона."
      );
      endCurrentCall();
    });
}

// Створення RTCPeerConnection
function createPeerConnection() {
  // Конфігурація STUN/TURN серверів
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  peerConnection = new RTCPeerConnection(configuration);

  // Обробка ICE кандидатів
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        sender: currentUser.id,
        receiver: master.id,
        candidate: event.candidate,
      });
    }
  };

  // Обробка зміни стану з'єднання
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);

    if (
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed" ||
      peerConnection.connectionState === "closed"
    ) {
      endCurrentCall();
    }
  };

  // Обробка отримання віддалених треків
  peerConnection.ontrack = (event) => {
    remoteStream = event.streams[0];

    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
    }
  };
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

    // Відображення локального відео
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = true;
      }
    }
  } else {
    videoContainer.style.display = "block";
    audioCallUi.style.display = "none";
    toggleVideo.style.display = "block";

    // Відображення локального відео
    if (localStream) {
      localVideo.srcObject = localStream;
    }
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
    sender: currentUser.id,
    receiver: master.id,
  });
}

// Обробка вхідного дзвінка
function handleIncomingCall(callData) {
  // Відображення інформації про дзвінок
  callerImg.src = callData.caller.avatar || "https://via.placeholder.com/80";
  callerName.textContent = callData.caller.username;
  callTypeText.textContent =
    callData.type === "video" ? "Відео дзвінок" : "Аудіо дзвінок";

  // Збереження даних дзвінка
  callModal.dataset.callerId = callData.caller.id;
  callModal.dataset.callType = callData.type;
  callModal.dataset.sdp = JSON.stringify(callData.sdp);

  // Відтворення звуку дзвінка
  const ringtone = new Audio("/sounds/ringtone.mp3");
  ringtone.loop = true;
  ringtone
    .play()
    .catch((e) => console.error("Не вдалося відтворити звук дзвінка:", e));

  // Збереження посилання на звук для подальшої зупинки
  callModal.ringtone = ringtone;

  // Показ модального вікна
  callModal.style.display = "flex";
}

// Прийняття вхідного дзвінка
function acceptIncomingCall() {
  const callerId = callModal.dataset.callerId;
  const callType = callModal.dataset.callType;
  const sdp = JSON.parse(callModal.dataset.sdp);

  // Зупинка звуку дзвінка
  if (callModal.ringtone) {
    callModal.ringtone.pause();
    callModal.ringtone.currentTime = 0;
  }

  // Приховування модального вікна
  callModal.style.display = "none";

  // Запит доступу до медіа пристроїв
  const constraints = {
    audio: true,
    video: callType === "video",
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      localStream = stream;

      // Створення RTCPeerConnection
      createPeerConnection();

      // Додавання локальних треків до з'єднання
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      // Встановлення віддаленого опису
      return peerConnection.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    })
    .then(() => {
      // Створення відповіді
      return peerConnection.createAnswer();
    })
    .then((answer) => {
      // Встановлення локального опису
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      // Відправка відповіді через сокет
      socket.emit("call-answer", {
        sender: currentUser.id,
        receiver: callerId,
        sdp: peerConnection.localDescription,
      });

      // Показ інтерфейсу дзвінка
      const caller = {
        id: callerId,
        username: callerName.textContent,
        avatar: callerImg.src,
      };

      showActiveCall(caller, callType);
    })
    .catch((error) => {
      console.error("Помилка при прийнятті дзвінка:", error);
      alert(
        "Не вдалося прийняти дзвінок. Перевірте доступ до камери та мікрофона."
      );
      endCurrentCall();
    });
}

// Відхилення вхідного дзвінка
function declineIncomingCall() {
  const callerId = callModal.dataset.callerId;

  // Зупинка звуку дзвінка
  if (callModal.ringtone) {
    callModal.ringtone.pause();
    callModal.ringtone.currentTime = 0;
  }

  // Приховування модального вікна
  callModal.style.display = "none";

  // Відправка відмови через сокет
  socket.emit("call-declined", {
    sender: currentUser.id,
    receiver: callerId,
  });
}

// Налаштування обробників подій
function setupEventListeners() {
  // Надсилання повідомлення
  sendBtn.addEventListener("click", sendTextMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  });

  // Запис голосового повідомлення
  voiceBtn.addEventListener("click", startVoiceRecording);

  // Запис відео повідомлення
  videoBtn.addEventListener("click", startVideoRecording);

  // Прикріплення файлу
  attachBtn.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // Перевірка розміру файлу (максимум 10 МБ)
        if (file.size > 10 * 1024 * 1024) {
          alert("Розмір файлу не повинен перевищувати 10 МБ");
          return;
        }

        // Створення FormData для відправки файлу на сервер
        const formData = new FormData();
        formData.append("file", file);
        formData.append("senderId", currentUser.id);
        formData.append("receiverId", master.id);

        // Визначення типу файлу
        let fileType = "file";
        if (file.type.startsWith("image/")) {
          fileType = "image";
        }

        formData.append("type", fileType);

        // Відправка файлу на сервер
        fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Не вдалося завантажити файл");
            }
            return response.json();
          })
          .then((data) => {
            // Створення повідомлення з посиланням на завантажений файл
            const message = {
              id: generateId(),
              sender: currentUser.id,
              receiver: master.id,
              type: fileType,
              content: data.fileUrl,
              fileName: file.name,
              time: getCurrentTime(),
              read: false,
            };

            // Додавання повідомлення до масиву
            messages.push(message);

            // Відображення повідомлень
            renderMessages();

            // Надсилання повідомлення через сокет
            socket.emit("message", {
              ...message,
              username: currentUser.username,
            });
          })
          .catch((error) => {
            console.error("Помилка при завантаженні файлу:", error);
            alert("Не вдалося завантажити файл. Спробуйте ще раз.");
          });
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();

    // Видалення елемента після вибору файлу
    setTimeout(() => {
      document.body.removeChild(fileInput);
    }, 1000);
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

  declineCall.addEventListener("click", declineIncomingCall);
  acceptCall.addEventListener("click", acceptIncomingCall);

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
    if (message.receiver === currentUser.id && message.sender === master.id) {
      // Додавання повідомлення до масиву
      messages.push(message);

      // Відображення повідомлень
      renderMessages();

      // Відтворення звуку нового повідомлення
      const messageSound = new Audio("/sounds/message.mp3");
      messageSound
        .play()
        .catch((e) =>
          console.error("Не вдалося відтворити звук повідомлення:", e)
        );
    }
  });

  socket.on("call-offer", handleIncomingCall);

  socket.on("call-answer", (data) => {
    if (data.sender === master.id && data.receiver === currentUser.id) {
      // Встановлення віддаленого опису
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(data.sdp))
        .catch((error) => {
          console.error("Помилка при встановленні віддаленого опису:", error);
          endCurrentCall();
        });
    }
  });

  socket.on("call-declined", (data) => {
    if (data.sender === master.id && data.receiver === currentUser.id) {
      alert("Майстер відхилив дзвінок");
      endCurrentCall();
    }
  });

  socket.on("ice-candidate", (data) => {
    if (
      (data.sender === master.id && data.receiver === currentUser.id) ||
      (data.sender === currentUser.id && data.receiver === master.id)
    ) {
      if (peerConnection) {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch((error) => {
            console.error("Помилка при додаванні ICE кандидата:", error);
          });
      }
    }
  });

  socket.on("end-call", (data) => {
    if (data.sender === master.id && data.receiver === currentUser.id) {
      alert("Майстер завершив дзвінок");
      endCurrentCall();
    }
  });

  socket.on("user-status", (data) => {
    if (data.userId === master.id) {
      master.status = data.status;
      masterStatus.textContent = data.status === "online" ? "Онлайн" : "Офлайн";
      masterStatus.className = data.status;
    }
  });
}

// Запуск додатку
init();