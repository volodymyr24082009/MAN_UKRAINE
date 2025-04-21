// Global variables
let userId = null;
let username = "";
let socket = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let callerId = null;
let callerName = "";
let callTimer = null;
let callDuration = 0;
let callInProgress = false;
let isMicMuted = false;
let isCameraOff = false;
let isFullscreen = false;
const ringtone = document.getElementById("call-ringtone");
const callEndSound = document.getElementById("call-end-sound");

// ICE servers configuration for WebRTC
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// DOM elements
const initialScreen = document.getElementById("initial-screen");
const callScreen = document.getElementById("call-screen");
const callHistory = document.getElementById("call-history");
const callNotification = document.getElementById("call-notification");
const historyList = document.getElementById("history-list");
const callUserName = document.getElementById("call-user-name");
const callTimerElement = document.getElementById("call-timer");
const callStatusElement = document.getElementById("call-status");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const localVideoPlaceholder = document.getElementById(
  "local-video-placeholder"
);
const remoteVideoPlaceholder = document.getElementById(
  "remote-video-placeholder"
);
const toggleMicBtn = document.getElementById("toggle-mic-btn");
const toggleCameraBtn = document.getElementById("toggle-camera-btn");
const endCallBtn = document.getElementById("end-call-btn");
const toggleFullscreenBtn = document.getElementById("toggle-fullscreen-btn");
const onlineStatus = document.getElementById("online-status");
const incomingCallName = document.getElementById("incoming-call-name");
const acceptCallBtn = document.getElementById("accept-call-btn");
const declineCallBtn = document.getElementById("decline-call-btn");
const usernameDisplay = document.getElementById("username-display");
const logoutBtn = document.getElementById("logout-btn");
const totalCallsElement = document.getElementById("total-calls");
const acceptedCallsElement = document.getElementById("accepted-calls");
const missedCallsElement = document.getElementById("missed-calls");
const avgDurationElement = document.getElementById("avg-duration");

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  initializeEventListeners();
  loadCallHistory();
  loadCallStats();
});

// Check if user is authenticated and is a master
function checkAuthentication() {
  const token = localStorage.getItem("token");
  userId = localStorage.getItem("userId");

  if (!token || !userId) {
    // Redirect to login page if not authenticated
    window.location.href = "/auth.html";
    return;
  }

  // Check if user is a master
  fetch(`/profile/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.profile) {
        username = data.profile.username || "";
        usernameDisplay.textContent = username;

        // If user is not a master, redirect to user page
        if (!data.profile.role_master) {
          window.location.href = "/video.html";
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching profile:", error);
      // Redirect to login page if there's an error
      window.location.href = "/auth.html";
    });
}

// Initialize event listeners
function initializeEventListeners() {
  // Online status change
  onlineStatus.addEventListener("change", updateOnlineStatus);

  // Call controls
  toggleMicBtn.addEventListener("click", toggleMicrophone);
  toggleCameraBtn.addEventListener("click", toggleCamera);
  endCallBtn.addEventListener("click", endCall);
  toggleFullscreenBtn.addEventListener("click", toggleFullscreen);

  // Call notification
  acceptCallBtn.addEventListener("click", acceptCall);
  declineCallBtn.addEventListener("click", declineCall);

  // Logout button
  logoutBtn.addEventListener("click", logout);

  // Initialize Socket.io
  initializeSocket();
}

// Initialize Socket.io connection
function initializeSocket() {
  socket = io();

  socket.on("connect", () => {
    console.log("Connected to Socket.io server");

    // Join as a master
    socket.emit("join", {
      id: userId,
      username: username,
      type: "master",
    });
  });

  // Handle incoming call
  socket.on("call-offer", (data) => {
    if (data.receiver === userId) {
      handleIncomingCall(data);
    }
  });

  // Handle call answer
  socket.on("call-answer", (data) => {
    if (data.receiver === userId) {
      handleCallAnswer(data);
    }
  });

  // Handle call declined
  socket.on("call-declined", (data) => {
    if (data.receiver === userId) {
      handleCallDeclined(data);
    }
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (data) => {
    if (data.receiver === userId) {
      handleIceCandidate(data);
    }
  });

  // Handle end call
  socket.on("end-call", (data) => {
    if (data.receiver === userId) {
      handleEndCall(data);
    }
  });
}

// Update online status
function updateOnlineStatus() {
  const status = onlineStatus.value;

  // Emit status change to server
  socket.emit("status-change", {
    id: userId,
    status: status,
  });

  console.log("Status changed to:", status);
}

// Load call history from the server
function loadCallHistory() {
  const token = localStorage.getItem("token");

  historyList.innerHTML =
    '<div class="loading">Завантаження історії дзвінків...</div>';

  fetch(`/api/call-history/master/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.history || data.history.length === 0) {
        historyList.innerHTML =
          '<div class="loading">Історія дзвінків порожня</div>';
        return;
      }

      historyList.innerHTML = "";
      data.history.forEach((call) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        // Format date and time
        const callDate = new Date(call.created_at);
        const formattedDate = callDate.toLocaleDateString("uk-UA");
        const formattedTime = callDate.toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Format duration
        const duration = call.duration ? formatDuration(call.duration) : "0:00";

        // Determine status class
        let statusClass = "";
        switch (call.status) {
          case "completed":
            statusClass = "status-completed";
            break;
          case "missed":
            statusClass = "status-missed";
            break;
          case "rejected":
            statusClass = "status-rejected";
            break;
        }

        // Translate status
        let statusText = "";
        switch (call.status) {
          case "completed":
            statusText = "Завершено";
            break;
          case "missed":
            statusText = "Пропущено";
            break;
          case "rejected":
            statusText = "Відхилено";
            break;
          default:
            statusText = call.status;
        }

        historyItem.innerHTML = `
                <div class="history-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="history-info">
                    <div class="history-name">${
                      call.user_name || "Невідомий користувач"
                    }</div>
                    <div class="history-details">
                        <span class="history-time">${formattedDate}, ${formattedTime}</span>
                        <span class="history-duration"><i class="fas fa-clock"></i> ${duration}</span>
                        <span class="history-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;

        historyList.appendChild(historyItem);
      });
    })
    .catch((error) => {
      console.error("Error loading call history:", error);
      historyList.innerHTML =
        '<div class="loading">Помилка завантаження історії дзвінків</div>';
    });
}

// Load call statistics
function loadCallStats() {
  const token = localStorage.getItem("token");

  fetch(`/api/call-stats/master/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      totalCallsElement.textContent = data.total || 0;
      acceptedCallsElement.textContent = data.accepted || 0;
      missedCallsElement.textContent = data.missed || 0;
      avgDurationElement.textContent = data.avgDuration
        ? formatDuration(data.avgDuration)
        : "0:00";
    })
    .catch((error) => {
      console.error("Error loading call stats:", error);
    });
}

// Handle incoming call
function handleIncomingCall(data) {
  // Check if master is available
  if (onlineStatus.value === "busy" || onlineStatus.value === "offline") {
    // Automatically decline call if busy or offline
    socket.emit("call-declined", {
      sender: userId,
      receiver: data.sender,
    });

    // Save call to history as missed
    saveCallToHistory(data.sender, data.caller.username, "missed");
    return;
  }

  // Show notification
  callNotification.classList.remove("hidden");
  incomingCallName.textContent = data.caller.username;

  // Store call data
  callerId = data.sender;
  callerName = data.caller.username;

  // Store call data in accept button
  acceptCallBtn.dataset.callData = JSON.stringify(data);

  // Play ringtone
  ringtone.play();
}

// Accept incoming call
async function acceptCall() {
  try {
    // Hide notification
    callNotification.classList.add("hidden");

    // Stop ringtone
    ringtone.pause();
    ringtone.currentTime = 0;

    // Get call data
    const callData = JSON.parse(acceptCallBtn.dataset.callData);

    // Hide initial screen and history
    initialScreen.classList.add("hidden");
    callHistory.classList.add("hidden");

    // Show call screen
    callScreen.classList.remove("hidden");
    callUserName.textContent = callData.caller.username;
    callStatusElement.textContent = "Підключення...";

    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // Display local video
    localVideo.srcObject = localStream;
    localVideoPlaceholder.style.display = "none";

    // Create peer connection
    peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          sender: userId,
          receiver: callData.sender,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);

      if (peerConnection.connectionState === "connected") {
        callStatusElement.textContent = "З'єднано";
        startCallTimer();
        callInProgress = true;

        // Save call to history
        saveCallToHistory(
          callData.sender,
          callData.caller.username,
          "in-progress"
        );
      } else if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        endCall();
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      remoteVideo.srcObject = remoteStream;
      remoteVideoPlaceholder.style.display = "none";
    };

    // Set remote description (offer)
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(callData.offer)
    );

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer to caller
    socket.emit("call-answer", {
      sender: userId,
      receiver: callData.sender,
      answer: answer,
    });

    callStatusElement.textContent = "З'єднання...";
  } catch (error) {
    console.error("Error accepting call:", error);
    callStatusElement.textContent = "Помилка підключення";

    // Close call screen after a delay
    setTimeout(() => {
      endCall();
      initialScreen.classList.remove("hidden");
      callHistory.classList.remove("hidden");
      callScreen.classList.add("hidden");
    }, 3000);
  }
}

// Decline incoming call
function declineCall() {
  // Hide notification
  callNotification.classList.add("hidden");

  // Stop ringtone
  ringtone.pause();
  ringtone.currentTime = 0;

  // Get call data
  const callData = JSON.parse(acceptCallBtn.dataset.callData);

  // Send decline message
  socket.emit("call-declined", {
    sender: userId,
    receiver: callData.sender,
  });

  // Save call to history
  saveCallToHistory(callData.sender, callData.caller.username, "rejected");
}

// Handle call answer
async function handleCallAnswer(data) {
  try {
    // Set remote description (answer)
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
    callStatusElement.textContent = "З'єднання...";
  } catch (error) {
    console.error("Error handling call answer:", error);
    callStatusElement.textContent = "Помилка підключення";

    // Close call screen after a delay
    setTimeout(() => {
      endCall();
      initialScreen.classList.remove("hidden");
      callHistory.classList.remove("hidden");
      callScreen.classList.add("hidden");
    }, 3000);
  }
}

// Handle call declined
function handleCallDeclined(data) {
  callStatusElement.textContent = "Дзвінок відхилено";

  // Play call end sound
  callEndSound.play();

  // Close call screen after a delay
  setTimeout(() => {
    endCall();
    initialScreen.classList.remove("hidden");
    callHistory.classList.remove("hidden");
    callScreen.classList.add("hidden");
  }, 3000);

  // Save call to history
  saveCallToHistory(data.sender, callerName, "rejected");
}

// Handle ICE candidate
async function handleIceCandidate(data) {
  try {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (error) {
    console.error("Error handling ICE candidate:", error);
  }
}

// Handle end call
function handleEndCall(data) {
  callStatusElement.textContent = "Дзвінок завершено";

  // Play call end sound
  callEndSound.play();

  // Close call screen after a delay
  setTimeout(() => {
    endCall();
    initialScreen.classList.remove("hidden");
    callHistory.classList.remove("hidden");
    callScreen.classList.add("hidden");
  }, 3000);

  // Save call to history
  saveCallToHistory(data.sender, callerName, "completed");
}

// End call
function endCall() {
  // Stop call timer
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Reset video elements
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  localVideoPlaceholder.style.display = "flex";
  remoteVideoPlaceholder.style.display = "flex";

  // Reset call status
  callStatusElement.textContent = "";
  callTimerElement.textContent = "00:00";
  callDuration = 0;

  // If call was in progress, send end call message
  if (callInProgress && callerId) {
    socket.emit("end-call", {
      sender: userId,
      receiver: callerId,
    });

    // Save call to history
    saveCallToHistory(callerId, callerName, "completed");
  }

  // Reset call state
  callInProgress = false;
  isMicMuted = false;
  isCameraOff = false;
  toggleMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  toggleCameraBtn.innerHTML = '<i class="fas fa-video"></i>';
  toggleMicBtn.classList.remove("muted");
  toggleCameraBtn.classList.remove("camera-off");

  // Hide call screen
  callScreen.classList.add("hidden");

  // Show initial screen and history
  initialScreen.classList.remove("hidden");
  callHistory.classList.remove("hidden");

  // Reload call history and stats
  loadCallHistory();
  loadCallStats();
}

// Toggle microphone
function toggleMicrophone() {
  if (localStream) {
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      isMicMuted = !isMicMuted;
      audioTracks[0].enabled = !isMicMuted;

      if (isMicMuted) {
        toggleMicBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        toggleMicBtn.classList.add("muted");
      } else {
        toggleMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        toggleMicBtn.classList.remove("muted");
      }
    }
  }
}

// Toggle camera
function toggleCamera() {
  if (localStream) {
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      isCameraOff = !isCameraOff;
      videoTracks[0].enabled = !isCameraOff;

      if (isCameraOff) {
        toggleCameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
        toggleCameraBtn.classList.add("camera-off");
        localVideoPlaceholder.style.display = "flex";
      } else {
        toggleCameraBtn.innerHTML = '<i class="fas fa-video"></i>';
        toggleCameraBtn.classList.remove("camera-off");
        localVideoPlaceholder.style.display = "none";
      }
    }
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  const videoContainer = document.querySelector(".video-container");

  if (!isFullscreen) {
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen();
    } else if (videoContainer.webkitRequestFullscreen) {
      videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
      videoContainer.msRequestFullscreen();
    }

    toggleFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    toggleFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
  }

  isFullscreen = !isFullscreen;
}

// Start call timer
function startCallTimer() {
  callDuration = 0;
  callTimerElement.textContent = "00:00";

  callTimer = setInterval(() => {
    callDuration++;
    callTimerElement.textContent = formatDuration(callDuration);
  }, 1000);
}

// Format duration in seconds to MM:SS
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

// Save call to history
function saveCallToHistory(userId, userName, status) {
  const token = localStorage.getItem("token");

  fetch("/api/call-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      master_id: userId,
      user_name: userName,
      status: status,
      duration: callDuration,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Call saved to history:", data);

      // Reload call history and stats after saving
      loadCallHistory();
      loadCallStats();
    })
    .catch((error) => {
      console.error("Error saving call to history:", error);
    });
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "/auth.html";
}
