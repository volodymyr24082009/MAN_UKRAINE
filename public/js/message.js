// Message type selection
const messageTypeRadios = document.querySelectorAll('input[name="messageType"]');
const textMessageGroup = document.getElementById('textMessageGroup');
const voiceMessageGroup = document.getElementById('voiceMessageGroup');
const videoMessageGroup = document.getElementById('videoMessageGroup');
const textMessage = document.getElementById('textMessage');

messageTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        // Hide all message groups
        textMessageGroup.classList.add('hidden');
        voiceMessageGroup.classList.add('hidden');
        videoMessageGroup.classList.add('hidden');
        
        // Remove required attribute from text message
        textMessage.removeAttribute('required');
        
        // Show selected message group
        if (radio.value === 'text') {
            textMessageGroup.classList.remove('hidden');
            textMessage.setAttribute('required', '');
        } else if (radio.value === 'voice') {
            voiceMessageGroup.classList.remove('hidden');
        } else if (radio.value === 'video') {
            videoMessageGroup.classList.remove('hidden');
        }
    });
});

// Voice recording functionality
let voiceRecorder;
let voiceStream;
let voiceBlob;

const startVoiceBtn = document.getElementById('startVoiceBtn');
const stopVoiceBtn = document.getElementById('stopVoiceBtn');
const voicePreview = document.getElementById('voicePreview');
const voiceIndicator = document.getElementById('voiceIndicator');

startVoiceBtn.addEventListener('click', async () => {
    try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceRecorder = new MediaRecorder(voiceStream);
        
        const voiceChunks = [];
        voiceRecorder.ondataavailable = e => voiceChunks.push(e.data);
        
        voiceRecorder.onstop = () => {
            voiceBlob = new Blob(voiceChunks, { type: 'audio/webm' });
            const voiceUrl = URL.createObjectURL(voiceBlob);
            voicePreview.src = voiceUrl;
            voicePreview.classList.remove('hidden');
            voiceIndicator.classList.add('hidden');
            
            // Stop all tracks
            voiceStream.getTracks().forEach(track => track.stop());
        };
        
        voiceRecorder.start();
        startVoiceBtn.disabled = true;
        stopVoiceBtn.disabled = false;
        voiceIndicator.classList.remove('hidden');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
    }
});

stopVoiceBtn.addEventListener('click', () => {
    if (voiceRecorder && voiceRecorder.state !== 'inactive') {
        voiceRecorder.stop();
        startVoiceBtn.disabled = false;
        stopVoiceBtn.disabled = true;
    }
});

// Video recording functionality
let videoRecorder;
let videoStream;
let videoBlob;

const startVideoBtn = document.getElementById('startVideoBtn');
const stopVideoBtn = document.getElementById('stopVideoBtn');
const videoPreview = document.getElementById('videoPreview');
const cameraPreview = document.getElementById('cameraPreview');
const videoIndicator = document.getElementById('videoIndicator');

startVideoBtn.addEventListener('click', async () => {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Create video element for live preview
        const livePreview = document.createElement('video');
        livePreview.srcObject = videoStream;
        livePreview.autoplay = true;
        livePreview.muted = true; // Mute to prevent feedback
        cameraPreview.innerHTML = '';
        cameraPreview.appendChild(livePreview);
        
        videoRecorder = new MediaRecorder(videoStream);
        
        const videoChunks = [];
        videoRecorder.ondataavailable = e => videoChunks.push(e.data);
        
        videoRecorder.onstop = () => {
            videoBlob = new Blob(videoChunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(videoBlob);
            videoPreview.src = videoUrl;
            videoPreview.classList.remove('hidden');
            videoIndicator.classList.add('hidden');
            
            // Clear camera preview
            cameraPreview.innerHTML = '';
            
            // Stop all tracks
            videoStream.getTracks().forEach(track => track.stop());
        };
        
        videoRecorder.start();
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        videoIndicator.classList.remove('hidden');
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please check permissions.');
    }
});

stopVideoBtn.addEventListener('click', () => {
    if (videoRecorder && videoRecorder.state !== 'inactive') {
        videoRecorder.stop();
        startVideoBtn.disabled = false;
        stopVideoBtn.disabled = true;
    }
});

// Form submission
const messageForm = document.getElementById('messageForm');
const statusMessage = document.getElementById('statusMessage');
const submitBtn = document.getElementById('submitBtn');

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const messageType = document.querySelector('input[name="messageType"]:checked').value;
    
    if (!username || !email) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    if (messageType === 'text' && !textMessage.value) {
        showStatus('Please enter a message', 'error');
        return;
    }
    
    if (messageType === 'voice' && !voiceBlob) {
        showStatus('Please record a voice message', 'error');
        return;
    }
    
    if (messageType === 'video' && !videoBlob) {
        showStatus('Please record a video message', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    showStatus('Sending message...', 'info');
    
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('messageType', messageType);
        
        if (messageType === 'text') {
            formData.append('textMessage', textMessage.value);
        } else if (messageType === 'voice') {
            formData.append('voiceMessage', voiceBlob, 'voice.webm');
        } else if (messageType === 'video') {
            formData.append('videoMessage', videoBlob, 'video.webm');
        }
        
        const response = await fetch('/send-message', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showStatus('Message sent successfully!', 'success');
            messageForm.reset();
            
            // Reset previews
            voicePreview.classList.add('hidden');
            videoPreview.classList.add('hidden');
            
            // Reset blobs
            voiceBlob = null;
            videoBlob = null;
            
            // Show text message group by default
            textMessageGroup.classList.remove('hidden');
            voiceMessageGroup.classList.add('hidden');
            videoMessageGroup.classList.add('hidden');
            textMessage.setAttribute('required', '');
        } else {
            showStatus(`Error: ${result.error}`, 'error');
        }
    } catch (err) {
        console.error('Error sending message:', err);
        showStatus('Failed to send message. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.classList.remove('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
}