document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const mastersList = document.getElementById("mastersList");
  const callButton = document.getElementById("callButton");
  const errorMessage = document.getElementById("errorMessage");
  const videoContainer = document.getElementById("videoContainer");
  const closeCallButton = document.getElementById("closeCallButton");
  const masterNameSpan = document.getElementById("masterName");
  const jitsiContainer = document.getElementById("jitsiContainer");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const industryFilter = document.getElementById("industryFilter");

  // State
  let masters = [];
  let filteredMasters = [];
  let jitsiApi = null;

  // Fetch masters from the server
  async function fetchMasters() {
    try {
      const response = await fetch("/api/masters");
      if (!response.ok) {
        throw new Error("Failed to fetch masters");
      }

      const data = await response.json();
      masters = data;
      filteredMasters = [...masters];

      // Populate industry filter
      populateIndustryFilter();

      // Render masters
      renderMasters();
    } catch (error) {
      console.error("Error fetching masters:", error);
      mastersList.innerHTML = `
                <div class="error-state">
                    <p>Не вдалося завантажити список майстрів. Спробуйте оновити сторінку.</p>
                    <button onclick="location.reload()">Оновити</button>
                </div>
            `;
    }
  }

  // Populate industry filter dropdown
  function populateIndustryFilter() {
    // Get unique industries
    const industries = [
      ...new Set(masters.flatMap((master) => master.industries)),
    ];

    // Sort alphabetically
    industries.sort();

    // Add options to select
    industries.forEach((industry) => {
      const option = document.createElement("option");
      option.value = industry;
      option.textContent = industry;
      industryFilter.appendChild(option);
    });
  }

  // Render masters list
  function renderMasters() {
    if (filteredMasters.length === 0) {
      mastersList.innerHTML = `
                <div class="no-results">
                    <p>Не знайдено майстрів за вашим запитом.</p>
                </div>
            `;
      return;
    }

    mastersList.innerHTML = "";

    filteredMasters.forEach((master) => {
      const masterCard = document.createElement("div");
      masterCard.className = "master-card";

      // Get primary industry (first in the list)
      const primaryIndustry =
        master.industries && master.industries.length > 0
          ? master.industries[0]
          : "Загальна галузь";

      // Get industry icon
      const industryIcon = getIndustryIcon(primaryIndustry);

      masterCard.innerHTML = `
                <input type="checkbox" class="master-checkbox" data-id="${
                  master.id
                }">
                <div class="master-info">
                    <div class="master-name">${master.first_name} ${
        master.last_name
      }</div>
                    <div class="master-industry">
                        <i class="${industryIcon}"></i>
                        ${primaryIndustry}
                    </div>
                    <div class="master-rating">
                        <i class="fas fa-star"></i>
                        <span>${(Math.random() * 2 + 3).toFixed(1)} (${
        Math.floor(Math.random() * 50) + 5
      } відгуків)</span>
                    </div>
                </div>
            `;

      mastersList.appendChild(masterCard);
    });

    // Add event listeners to checkboxes
    addCheckboxListeners();
  }

  // Get industry icon based on industry name
  function getIndustryIcon(industry) {
    const icons = {
      "Інформаційні технології": "fas fa-laptop-code",
      Медицина: "fas fa-heartbeat",
      Енергетика: "fas fa-bolt",
      "Аграрна галузь": "fas fa-tractor",
      "Фінанси та банківська справа": "fas fa-money-bill-wave",
      Освіта: "fas fa-graduation-cap",
      "Туризм і гостинність": "fas fa-plane",
      "Будівництво та нерухомість": "fas fa-hard-hat",
      Транспорт: "fas fa-truck",
      "Мистецтво і культура": "fas fa-palette",
    };

    return icons[industry] || "fas fa-briefcase";
  }

  // Add event listeners to checkboxes
  function addCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".master-checkbox");

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        // If this checkbox is checked, uncheck all others
        if (this.checked) {
          checkboxes.forEach((cb) => {
            if (cb !== this) {
              cb.checked = false;
            }
          });

          // Enable call button
          callButton.disabled = false;

          // Hide error message
          errorMessage.classList.remove("show");
        } else {
          // If no checkboxes are checked, disable call button
          const anyChecked = Array.from(checkboxes).some((cb) => cb.checked);
          callButton.disabled = !anyChecked;
        }
      });
    });
  }

  // Filter masters based on search and industry
  function filterMasters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedIndustry = industryFilter.value;

    filteredMasters = masters.filter((master) => {
      // Check if master matches search term
      const nameMatch = `${master.first_name} ${master.last_name}`
        .toLowerCase()
        .includes(searchTerm);

      // Check if master has selected industry
      const industryMatch =
        !selectedIndustry ||
        (master.industries && master.industries.includes(selectedIndustry));

      return nameMatch && industryMatch;
    });

    renderMasters();
  }

  // Initialize Jitsi Meet API
  function initJitsiMeet(masterId) {
    // Find selected master
    const selectedMaster = masters.find((m) => m.id === masterId);

    if (!selectedMaster) {
      console.error("Selected master not found");
      return;
    }

    // Set master name in the call title
    masterNameSpan.textContent = `${selectedMaster.first_name} ${selectedMaster.last_name}`;

    // Show video container
    videoContainer.classList.remove("hidden");

    // Generate a unique room name
    const roomName = `profix-call-${Date.now()}-${masterId}`;

    // Initialize Jitsi Meet API
    const domain = "meet.jit.si";
    const options = {
      roomName: roomName,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainer,
      userInfo: {
        displayName: "Клієнт",
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "chat",
          "recording",
          "livestreaming",
          "etherpad",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
          "videobackgroundblur",
          "download",
          "help",
          "mute-everyone",
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: "#f9fafb",
        DEFAULT_REMOTE_DISPLAY_NAME: "Майстер",
        TOOLBAR_ALWAYS_VISIBLE: true,
      },
    };

    // Create Jitsi Meet API instance
    jitsiApi = new JitsiMeetExternalAPI(domain, options);

    // Add event listeners
    jitsiApi.addEventListeners({
      videoConferenceJoined: () => {
        console.log("Local user joined");

        // Notify the server that a call has started
        notifyCallStarted(masterId);
      },
      videoConferenceLeft: () => {
        console.log("Local user left");
        closeVideoCall();
      },
    });
  }

  // Notify the server that a call has started
  async function notifyCallStarted(masterId) {
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          master_id: masterId,
          status: "started",
        }),
      });
    } catch (error) {
      console.error("Error notifying call start:", error);
    }
  }

  // Close video call
  function closeVideoCall() {
    if (jitsiApi) {
      jitsiApi.dispose();
      jitsiApi = null;
    }

    videoContainer.classList.add("hidden");
  }

  // Event Listeners
  callButton.addEventListener("click", function () {
    const checkboxes = document.querySelectorAll(".master-checkbox");
    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);

    if (checkedBoxes.length === 0) {
      // Show error message
      errorMessage.textContent = "Будь ласка, оберіть майстра для дзвінка";
      errorMessage.classList.add("show");
      return;
    }

    if (checkedBoxes.length > 1) {
      // Show error message
      errorMessage.textContent =
        "Будь ласка, оберіть лише одного майстра для дзвінка";
      errorMessage.classList.add("show");
      return;
    }

    // Get selected master ID
    const masterId = parseInt(checkedBoxes[0].dataset.id);

    // Initialize Jitsi Meet
    initJitsiMeet(masterId);
  });

  closeCallButton.addEventListener("click", closeVideoCall);

  searchButton.addEventListener("click", filterMasters);

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      filterMasters();
    }
  });

  industryFilter.addEventListener("change", filterMasters);

  // Initial fetch
  fetchMasters();
});
