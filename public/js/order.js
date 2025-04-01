// Global variables
let allOrders = [];
let currentFilter = 'all';
let userRole = null;
let userId = null;

// DOM Elements
const ordersContainer = document.getElementById('ordersContainer');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const filterButtons = document.querySelectorAll('.filter-btn');
const orderDetailsModal = document.getElementById('orderDetailsModal');
const orderModalClose = document.getElementById('orderModalClose');
const orderModalContent = document.getElementById('orderModalContent');
const orderModalActions = document.getElementById('orderModalActions');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Check user authentication
  checkUserLoggedIn();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load orders
  fetchOrders();
  
  // Set up real-time updates
  setupRealTimeUpdates();
});

// Check if user is logged in and get role
function checkUserLoggedIn() {
  userId = localStorage.getItem('userId');
  
  if (!userId) {
    // Redirect to login page if not logged in
    window.location.href = 'auth.html';
    return;
  }
  
  // Fetch user profile to determine role
  fetch(`/profile/${userId}`)
    .then(response => response.json())
    .then(data => {
      if (data.profile) {
        userRole = data.profile.role_master ? 'master' : 'user';
        
        // Check if user is admin (for demo purposes, user with ID 1 is admin)
        if (userId === '1') {
          userRole = 'admin';
        }
        
        // Update UI based on user role
        updateUIForRole();
      }
    })
    .catch(error => {
      console.error('Error fetching user profile:', error);
    });
}

// Update UI elements based on user role
function updateUIForRole() {
  // Show/hide elements based on role
  if (userRole === 'admin') {
    // Admin can see all orders
    fetchOrders('/orders');
  } else if (userRole === 'master') {
    // Masters can see pending orders and their own orders
    fetchOrders(`/orders/master/${userId}`);
  } else {
    // Regular users can only see their own orders
    fetchOrders(`/orders/user/${userId}`);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active filter
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Apply filter
      currentFilter = button.dataset.status;
      filterOrders();
    });
  });
  
  // Modal close button
  orderModalClose.addEventListener('click', () => {
    orderDetailsModal.classList.remove('active');
  });
  
  // Close modal when clicking outside
  orderDetailsModal.addEventListener('click', (e) => {
    if (e.target === orderDetailsModal) {
      orderDetailsModal.classList.remove('active');
    }
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  // Check for saved theme preference
  if (localStorage.getItem('theme') === 'light') {
    htmlElement.classList.remove('dark');
    htmlElement.classList.add('light');
    themeToggle.checked = true;
  }

  // Toggle theme when switch is clicked
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
  
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  mobileMenuBtn.addEventListener('click', function() {
    navMenu.classList.toggle('active');
    
    // Change icon based on menu state
    const icon = this.querySelector('i');
    if (navMenu.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
}

// Fetch orders from the server
function fetchOrders(endpoint = '/orders') {
  // Show loading spinner
  ordersContainer.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Завантаження заявок...</span>
    </div>
  `;
  
  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      if (data.orders && data.orders.length > 0) {
        allOrders = data.orders;
        filterOrders();
        noOrdersMessage.style.display = 'none';
      } else {
        ordersContainer.innerHTML = '';
        noOrdersMessage.style.display = 'flex';
      }
    })
    .catch(error => {
      console.error('Error fetching orders:', error);
      ordersContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Помилка при завантаженні заявок. Спробуйте оновити сторінку.</p>
        </div>
      `;
    });
}

// Filter orders based on current filter
function filterOrders() {
  let filteredOrders = [];
  
  if (currentFilter === 'all') {
    filteredOrders = allOrders;
  } else {
    filteredOrders = allOrders.filter(order => order.status === currentFilter);
  }
  
  renderOrders(filteredOrders);
}

// Render orders to the container
function renderOrders(orders) {
  if (orders.length === 0) {
    ordersContainer.innerHTML = '';
    noOrdersMessage.style.display = 'flex';
    return;
  }
  
  noOrdersMessage.style.display = 'none';
  ordersContainer.innerHTML = '';
  
  orders.forEach(order => {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.dataset.id = order.id;
    
    // Add new order animation if created in the last hour
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const isNew = (now - orderDate) < 3600000; // 1 hour in milliseconds
    if (isNew) {
      orderCard.classList.add('new-order');
    }
    
    // Format date
    const formattedDate = new Date(order.created_at).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get status class and text
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    
    // Truncate description
    const shortDescription = order.description ? 
      (order.description.length > 100 ? order.description.substring(0, 100) + '...' : order.description) : 
      'Опис відсутній';
    
    // Get industry icon
    const industryIcon = getIndustryIcon(order.industry);
    
    orderCard.innerHTML = `
      <div class="order-status ${statusClass}">${statusText}</div>
      <h3 class="order-title">${order.title}</h3>
      <div class="order-industry">
        <i class="${industryIcon}"></i>
        <span>${order.industry || 'Галузь не вказана'}</span>
      </div>
      <p class="order-description">${shortDescription}</p>
      <div class="order-meta">
        <div class="order-date">
          <i class="far fa-calendar-alt"></i>
          <span>${formattedDate}</span>
        </div>
      </div>
      <div class="order-actions">
        <button class="order-btn view-btn" data-id="${order.id}">
          <i class="fas fa-eye"></i>
          Переглянути
        </button>
      </div>
    `;
    
    // Add action buttons for masters and admins if order is pending
    if ((userRole === 'master' || userRole === 'admin') && order.status === 'pending') {
      const actionsDiv = orderCard.querySelector('.order-actions');
      actionsDiv.innerHTML = `
        <button class="order-btn accept-btn" data-id="${order.id}">
          <i class="fas fa-check"></i>
          Прийняти
        </button>
        <button class="order-btn reject-btn" data-id="${order.id}">
          <i class="fas fa-times"></i>
          Відхилити
        </button>
      `;
    }
    
    ordersContainer.appendChild(orderCard);
  });
  
  // Add event listeners to buttons
  addOrderButtonListeners();
}

// Add event listeners to order buttons
function addOrderButtonListeners() {
  // View buttons
  const viewButtons = document.querySelectorAll('.view-btn');
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.id;
      showOrderDetails(orderId);
    });
  });
  
  // Accept buttons
  const acceptButtons = document.querySelectorAll('.accept-btn');
  acceptButtons.forEach(button => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.id;
      updateOrderStatus(orderId, 'completed');
    });
  });
  
  // Reject buttons
  const rejectButtons = document.querySelectorAll('.reject-btn');
  rejectButtons.forEach(button => {
    button.addEventListener('click', () => {
      const orderId = button.dataset.id;
      updateOrderStatus(orderId, 'rejected');
    });
  });
}

// Show order details in modal
function showOrderDetails(orderId) {
  const order = allOrders.find(o => o.id == orderId);
  
  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }
  
  // Format dates
  const createdDate = new Date(order.created_at).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const updatedDate = new Date(order.updated_at).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get status class and text
  const statusClass = getStatusClass(order.status);
  const statusText = getStatusText(order.status);
  
  // Get industry icon
  const industryIcon = getIndustryIcon(order.industry);
  
  // Populate modal content
  orderModalContent.innerHTML = `
    <h2 class="modal-title">${order.title}</h2>
    
    <div class="modal-info-group">
      <span class="modal-label">Статус:</span>
      <span class="modal-status ${statusClass}">${statusText}</span>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Галузь:</span>
      <div class="modal-value">
        <i class="${industryIcon}"></i>
        ${order.industry || 'Не вказано'}
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Опис проблеми:</span>
      <div class="modal-value">${order.description || 'Опис відсутній'}</div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Контактний телефон:</span>
      <div class="modal-value">
        <a href="tel:${order.phone}">${order.phone}</a>
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Замовник:</span>
      <div class="modal-value">
        ${order.user_first_name || ''} ${order.user_last_name || ''} 
        ${order.user_first_name || order.user_last_name ? '' : order.user_username || 'Невідомо'}
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Створено:</span>
      <div class="modal-value">${createdDate}</div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Оновлено:</span>
      <div class="modal-value">${updatedDate}</div>
    </div>
  `;
  
  // Add master info if assigned
  if (order.master_id) {
    const masterName = order.master_first_name || order.master_last_name ? 
      `${order.master_first_name || ''} ${order.master_last_name || ''}` : 
      order.master_username || 'Невідомо';
    
    orderModalContent.innerHTML += `
      <div class="modal-info-group">
        <span class="modal-label">Майстер:</span>
        <div class="modal-value">${masterName}</div>
      </div>
    `;
  }
  
  // Set up action buttons based on status and role
  orderModalActions.innerHTML = '';
  
  if ((userRole === 'master' || userRole === 'admin') && order.status === 'pending') {
    orderModalActions.innerHTML = `
      <button class="modal-btn modal-btn-accept" data-id="${order.id}">
        <i class="fas fa-check"></i>
        Прийняти заявку
      </button>
      <button class="modal-btn modal-btn-reject" data-id="${order.id}">
        <i class="fas fa-times"></i>
        Відхилити заявку
      </button>
    `;
  } else {
    orderModalActions.innerHTML = `
      <button class="modal-btn modal-btn-close">
        <i class="fas fa-times"></i>
        Закрити
      </button>
    `;
  }
  
  // Add event listeners to modal buttons
  const modalAcceptBtn = orderModalActions.querySelector('.modal-btn-accept');
  if (modalAcceptBtn) {
    modalAcceptBtn.addEventListener('click', () => {
      const orderId = modalAcceptBtn.dataset.id;
      updateOrderStatus(orderId, 'completed');
      orderDetailsModal.classList.remove('active');
    });
  }
  
  const modalRejectBtn = orderModalActions.querySelector('.modal-btn-reject');
  if (modalRejectBtn) {
    modalRejectBtn.addEventListener('click', () => {
      const orderId = modalRejectBtn.dataset.id;
      updateOrderStatus(orderId, 'rejected');
      orderDetailsModal.classList.remove('active');
    });
  }
  
  const modalCloseBtn = orderModalActions.querySelector('.modal-btn-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      orderDetailsModal.classList.remove('active');
    });
  }
  
  // Show modal
  orderDetailsModal.classList.add('active');
}

// Update order status
function updateOrderStatus(orderId, status) {
  // Show loading state
  const orderCard = document.querySelector(`.order-card[data-id="${orderId}"]`);
  if (orderCard) {
    orderCard.style.opacity = '0.7';
    orderCard.style.pointerEvents = 'none';
  }
  
  // Prepare request data
  const requestData = {
    status: status,
    master_id: userId
  };
  
  // Send update request
  fetch(`/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success message
        showNotification(`Заявку успішно ${status === 'completed' ? 'прийнято' : 'відхилено'}`, 'success');
        
        // Update local data
        const orderIndex = allOrders.findIndex(o => o.id == orderId);
        if (orderIndex !== -1) {
          allOrders[orderIndex].status = status;
          allOrders[orderIndex].master_id = userId;
        }
        
        // Re-render orders
        filterOrders();
      } else {
        showNotification('Помилка при оновленні статусу заявки', 'error');
        
        // Reset order card
        if (orderCard) {
          orderCard.style.opacity = '1';
          orderCard.style.pointerEvents = 'auto';
        }
      }
    })
    .catch(error => {
      console.error('Error updating order status:', error);
      showNotification('Помилка з\'єднання з сервером', 'error');
      
      // Reset order card
      if (orderCard) {
        orderCard.style.opacity = '1';
        orderCard.style.pointerEvents = 'auto';
      }
    });
}

// Set up real-time updates (polling for simplicity)
function setupRealTimeUpdates() {
  // Poll for updates every 30 seconds
  setInterval(() => {
    if (userRole === 'admin') {
      fetchOrders('/orders');
    } else if (userRole === 'master') {
      fetchOrders(`/orders/master/${userId}`);
    } else {
      fetchOrders(`/orders/user/${userId}`);
    }
  }, 30000);
}

// Helper function to get status class
function getStatusClass(status) {
  switch (status) {
    case 'pending':
      return 'status-pending';
    case 'completed':
      return 'status-completed';
    case 'rejected':
      return 'status-rejected';
    default:
      return '';
  }
}

// Helper function to get status text
function getStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Очікує розгляду';
    case 'completed':
      return 'Виконано';
    case 'rejected':
      return 'Відхилено';
    default:
      return 'Невідомо';
  }
}

// Helper function to get industry icon
function getIndustryIcon(industry) {
  const industryIcons = {
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
  
  return industryIcons[industry] || 'fas fa-briefcase';
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Set notification type
  notification.className = `notification ${type}`;
  
  // Set message
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Show notification
  notification.classList.add('active');
  
  // Add close button event listener
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('active');
  });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('active');
  }, 5000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background-color: var(--card-bg);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1001;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    max-width: 350px;
  }
  
  .notification.active {
    transform: translateX(0);
  }
  
  .notification-content {
    display: flex;
    align-items: center;
  }
  
  .notification-content i {
    margin-right: 10px;
    font-size: 18px;
  }
  
  .notification.success {
    border-left: 4px solid #2ecc71;
  }
  
  .notification.success i {
    color: #2ecc71;
  }
  
  .notification.error {
    border-left: 4px solid #e74c3c;
  }
  
  .notification.error i {
    color: #e74c3c;
  }
  
  .notification.info {
    border-left: 4px solid #3498db;
  }
  
  .notification.info i {
    color: #3498db;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    margin-left: 10px;
  }
  
  .notification-close:hover {
    color: var(--text-primary);
  }
  
  @media (max-width: 480px) {
    .notification {
      left: 20px;
      right: 20px;
      max-width: none;
    }
  }
`;

document.head.appendChild(notificationStyles);