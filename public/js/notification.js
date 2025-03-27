// Get DOM elements
const notificationArea = document.getElementById('notification-area');
const noNotificationsMessage = document.getElementById('no-notifications');
const testButton = document.getElementById('test-notification');

// Function to add a new notification
function addNotification(message, type = 'info') {
    // Hide the "no notifications" message if it's visible
    if (noNotificationsMessage.style.display !== 'none') {
        noNotificationsMessage.style.display = 'none';
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    
    // Create timestamp
    const timeElement = document.createElement('div');
    timeElement.className = 'notification-time';
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
    
    // Append elements
    notification.appendChild(messageElement);
    notification.appendChild(timeElement);
    
    // Add to notification area (at the top)
    notificationArea.insertBefore(notification, notificationArea.firstChild);
}

// Test notification button
testButton.addEventListener('click', function() {
    const types = ['success', 'info', 'warning', 'error'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const messages = [
        'New message received',
        'Your file has been uploaded',
        'System update required',
        'Payment processed successfully',
        'Connection lost, retrying...'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    addNotification(randomMessage, randomType);
});

// Simulate receiving notifications (for demonstration)
// In a real application, this would be replaced with your notification source
// (WebSockets, Server-Sent Events, polling, etc.)
setTimeout(() => {
    addNotification('Welcome to your notification center', 'info');
}, 1000);