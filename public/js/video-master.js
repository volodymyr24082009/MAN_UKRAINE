document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const statusToggle = document.getElementById('statusToggle');
    const statusText = document.getElementById('statusText');
    const masterName = document.getElementById('masterName');
    const masterIndustry = document.getElementById('masterIndustry').querySelector('span');
    const callsList = document.getElementById('callsList');
    const callsCount = document.getElementById('callsCount');
    const ratingValue = document.getElementById('ratingValue');
    const callNotification = document.getElementById('callNotification');
    const callerName = document.getElementById('callerName');
    const callTimer = document.getElementById('callTimer');
    const acceptCallBtn = document.getElementById('acceptCallBtn');
    const declineCallBtn = document.getElementById('declineCallBtn');
    const videoContainer = document.getElementById('videoContainer');
    const clientName = document.getElementById('clientName');
    const activeDuration = document.getElementById('activeDuration');
    const endCallButton = document.getElementById('endCallButton');
    const callEndedNotification = document.getElementById('callEndedNotification');
    const callDuration = document.getElementById('callDuration');
    const closeEndedNotification = document.getElementById('closeEndedNotification');
    const jitsiContainer = document.getElementById('jitsiContainer');
    
    // State
    let masterId = null;
    let masterData = null;
    let isOnline = true;
    let currentCallData = null;
    let jitsiApi = null;
    let callTimerInterval = null;
    let callTimeLeft = 30; // 30 seconds to answer
    let activeCallInterval = null;
    let activeCallDuration = 0;
    let socket = null;
    let recentCalls = [];
    
    // Initialize the page
    init();
    
    // Functions
    async function init() {
        // Get master ID from URL or localStorage
        masterId = getMasterId();
        
        if (!masterId) {
            // Redirect to login if no master ID
            window.location.href = '/login.html';
            return;
        }
        
        // Fetch master data
        await fetchMasterData();
        
        // Initialize Socket.io connection
        initializeSocket();
        
        // Fetch recent calls
        fetchRecentCalls();
        
        // Add event listeners
        addEventListeners();
    }
    
    function getMasterId() {
        // Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) return id;
        
        // Try to get from localStorage
        return localStorage.getItem('masterId');
    }
    
    async function fetchMasterData() {
        try {
            const response = await fetch(`/api/masters/${masterId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch master data');
            }
            
            masterData = await response.json();
            
            // Update UI with master data
            updateMasterUI();
        } catch (error) {
            console.error('Error fetching master data:', error);
            // Show error notification
            showErrorNotification('Не вдалося завантажити дані майстра');
        }
    }
    
    function updateMasterUI() {
        if (!masterData) return;
        
        // Update master name
        masterName.textContent = `${masterData.first_name} ${masterData.last_name}`;
        
        // Update master industry
        if (masterData.industries && masterData.industries.length > 0) {
            masterIndustry.textContent = masterData.industries[0];
            
            // Update industry icon
            const industryIcon = getIndustryIcon(masterData.industries[0]);
            masterIndustry.previousElementSibling.className = industryIcon;
        } else {
            masterIndustry.textContent = 'Загальна галузь';
        }
        
        // Update stats
        callsCount.textContent = masterData.calls_count || 0;
        ratingValue.textContent = masterData.rating || '0.0';
    }
    
    function getIndustryIcon(industry) {
        const icons = {
            'Інформаційні технології': 'fas fa-laptop-code',
            'Медицина': 'fas fa-heartbeat',
            'Енергетика': 'fas fa-bolt',
            'Аграрна галузь': 'fas fa-tractor',
            'Фінанси та банківська справа': 'fas fa-money-bill-wave',
            'Освіта': 'fas fa-graduation-cap',
            'Туризм і гостинність': 'fas fa-plane',
            'Будівництво та нерухомість': 'fas fa-hard-hat',
            'Транспорт': 'fas fa-truck',
            'Мистецтво і культура': 'fas fa-palette'
        };
        
        return icons[industry] || 'fas fa-briefcase';
    }
    
    function initializeSocket() {
        // Connect to Socket.io server
        socket = io();
        
        // Join master's room
        socket.emit('join-master', { masterId });
        
        // Listen for incoming calls
        socket.on('incoming-call', handleIncomingCall);
        
        // Listen for call cancellations
        socket.on('call-cancelled', handleCallCancelled);
        
        // Listen for connection status
        socket.on('connect', () => {
            console.log('Connected to Socket.io server');
            updateMasterStatus(isOnline);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
            updateMasterStatus(false);
        });
    }
    
    function updateMasterStatus(online) {
        isOnline = online;
        
        // Update UI
        statusToggle.checked = online;
        statusText.textContent = online ? 'Онлайн' : 'Офлайн';
        statusText.className = `status-text ${online ? 'online' : 'offline'}`;
        
        // Notify server about status change
        if (socket && socket.connected) {
            socket.emit('master-status', { masterId, online });
        }
    }
    
    async function fetchRecentCalls() {
        try {
            const response = await fetch(`/api/calls/master/${masterId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch recent calls');
            }
            
            const data = await response.json();
            recentCalls = data.calls || [];
            
            // Update UI with recent calls
            updateRecentCallsUI();
        } catch (error) {
            console.error('Error fetching recent calls:', error);
        }
    }
    
    function updateRecentCallsUI() {
        if (recentCalls.length === 0) {
            callsList.innerHTML = `
                <div class="no-calls-message">
                    <i class="fas fa-phone-slash"></i>
                    <p>У вас ще немає дзвінків</p>
                </div>
            `;
            return;
        }
        
        callsList.innerHTML = '';
        
        // Sort calls by date (newest first)
        recentCalls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Add each call to the list
        recentCalls.forEach(call => {
            const callItem = document.createElement('div');
            callItem.className = 'call-item';
            
            const callDate = new Date(call.created_at);
            const formattedDate = formatDate(callDate);
            
            let statusClass = '';
            let statusText = '';
            
            switch (call.status) {
                case 'completed':
                    statusClass = '';
                    statusText = 'Завершено';
                    break;
                case 'missed':
                    statusClass = 'missed';
                    statusText = 'Пропущено';
                    break;
                case 'ongoing':
                    statusClass = 'ongoing';
                    statusText = 'В процесі';
                    break;
                default:
                    statusClass = '';
                    statusText = 'Завершено';
            }
            
            callItem.innerHTML = `
                <div class="call-info">
                    <div class="call-icon">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="call-details">
                        <h3>${call.client_name || 'Клієнт'}</h3>
                        <p>${call.duration || '00:00'} хвилин</p>
                    </div>
                </div>
                <div class="call-meta">
                    <div class="call-time">${formattedDate}</div>
                    <div class="call-status ${statusClass}">${statusText}</div>
                </div>
            `;
            
            callsList.appendChild(callItem);
        });
    }
    
    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        // If less than 24 hours, show time
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        }
        
        // If less than 7 days, show day of week
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
            return days[date.getDay()];
        }
        
        // Otherwise show date
        return date.toLocaleDateString('uk-UA');
    }
    
    function handleIncomingCall(data) {
        // If offline, automatically decline the call
        if (!isOnline) {
            socket.emit('decline-call', { callId: data.callId, masterId });
            return;
        }
        
        // Store call data
        currentCallData = data;
        
        // Update UI
        callerName.textContent = data.clientName || 'Клієнт';
        
        // Show notification
        callNotification.classList.add('show');
        
        // Start timer
        callTimeLeft = 30;
        updateCallTimer();
        callTimerInterval = setInterval(updateCallTimer, 1000);
    }
    
    function updateCallTimer() {
        callTimeLeft--;
        
        // Format time as MM:SS
        const seconds = callTimeLeft % 60;
        const minutes = Math.floor(callTimeLeft / 60);
        callTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // If time is up, auto-decline the call
        if (callTimeLeft <= 0) {
            clearInterval(callTimerInterval);
            declineCall();
        }
    }
    
    function handleCallCancelled(data) {
        // If this is the current call, hide notification
        if (currentCallData && currentCallData.callId === data.callId) {
            hideCallNotification();
        }
    }
    
    function acceptCall() {
        if (!currentCallData) return;
        
        // Clear timer
        clearInterval(callTimerInterval);
        
        // Hide notification
        hideCallNotification();
        
        // Notify server that call was accepted
        socket.emit('accept-call', { callId: currentCallData.callId, masterId });
        
        // Initialize Jitsi Meet
        initJitsiMeet(currentCallData.roomName);
        
        // Show video container
        videoContainer.classList.remove('hidden');
        
        // Update client name
        clientName.textContent = currentCallData.clientName || 'Клієнт';
        
        // Start active call timer
        activeCallDuration = 0;
        updateActiveCallDuration();
        activeCallInterval = setInterval(updateActiveCallDuration, 1000);
    }
    
    function declineCall() {
        if (!currentCallData) return;
        
        // Clear timer
        clearInterval(callTimerInterval);
        
        // Hide notification
        hideCallNotification();
        
        // Notify server that call was declined
        socket.emit('decline-call', { callId: currentCallData.callId, masterId });
        
        // Reset current call data
        currentCallData = null;
    }
    
    function hideCallNotification() {
        callNotification.classList.remove('show');
    }
    
    function initJitsiMeet(roomName) {
        // Initialize Jitsi Meet API
        const domain = 'meet.jit.si';
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainer,
            userInfo: {
                displayName: `${masterData.first_name} ${masterData.last_name}`
            },
            configOverwrite: {
                prejoinPageEnabled: false,
                startWithAudioMuted: false,
                startWithVideoMuted: false
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
                ],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#f9fafb',
                DEFAULT_REMOTE_DISPLAY_NAME: 'Клієнт',
                TOOLBAR_ALWAYS_VISIBLE: true
            }
        };
        
        // Create Jitsi Meet API instance
        jitsiApi = new JitsiMeetExternalAPI(domain, options);
        
        // Add event listeners
        jitsiApi.addEventListeners({
            videoConferenceJoined: () => {
                console.log('Master joined the call');
            },
            videoConferenceLeft: () => {
                console.log('Master left the call');
                endCall();
            }
        });
    }
    
    function updateActiveCallDuration() {
        activeCallDuration++;
        
        // Format time as MM:SS
        const seconds = activeCallDuration % 60;
        const minutes = Math.floor(activeCallDuration / 60);
        activeDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function endCall() {
        // Clear active call timer
        clearInterval(activeCallInterval);
        
        // Dispose Jitsi Meet API
        if (jitsiApi) {
            jitsiApi.dispose();
            jitsiApi = null;
        }
        
        // Hide video container
        videoContainer.classList.add('hidden');
        
        // Show call ended notification
        callDuration.textContent = activeDuration.textContent;
        callEndedNotification.classList.remove('hidden');
        
        // Notify server that call has ended
        if (currentCallData) {
            socket.emit('end-call', { 
                callId: currentCallData.callId, 
                masterId,
                duration: activeDuration.textContent
            });
            
            // Add call to recent calls
            const newCall = {
                id: currentCallData.callId,
                client_name: currentCallData.clientName || 'Клієнт',
                duration: activeDuration.textContent,
                status: 'completed',
                created_at: new Date().toISOString()
            };
            
            recentCalls.unshift(newCall);
            updateRecentCallsUI();
            
            // Update calls count
            callsCount.textContent = parseInt(callsCount.textContent) + 1;
        }
        
        // Reset current call data
        currentCallData = null;
    }
    
    function showErrorNotification(message) {
        // You could implement a toast notification here
        alert(message);
    }
    
    function addEventListeners() {
        // Status toggle
        statusToggle.addEventListener('change', function() {
            updateMasterStatus(this.checked);
        });
        
        // Accept call button
        acceptCallBtn.addEventListener('click', acceptCall);
        
        // Decline call button
        declineCallBtn.addEventListener('click', declineCall);
        
        // End call button
        endCallButton.addEventListener('click', endCall);
        
        // Close call ended notification
        closeEndedNotification.addEventListener('click', function() {
            callEndedNotification.classList.add('hidden');
        });
    }
});