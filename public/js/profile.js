// Theme toggle functionality
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

// Tab functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Show corresponding content
        const tabName = this.getAttribute('data-tab');
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Load content based on tab
        if (tabName === 'orders') {
            loadUserOrders();
        } else if (tabName === 'reviews') {
            loadUserReviews();
        } else if (tabName === 'services') {
            loadUserServices(getUserId());
        }
    });
});

// Function to get user ID
function getUserId() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        return userId;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    
    if (urlUserId) {
        localStorage.setItem('userId', urlUserId);
        return urlUserId;
    }
    
    alert('Необхідно авторизуватися');
    window.location.href = '/auth.html';
    return null;
}

// Function to load user profile
async function loadUserProfile() {
    const userId = getUserId();
    if (!userId) return;
    
    try {
        const response = await fetch(`/profile/${userId}`);
        
        if (!response.ok) {
            throw new Error('Не вдалося завантажити профіль');
        }
        
        const data = await response.json();
        
        if (data.profile) {
            // Update profile header
            updateProfileHeader(data.profile);
            
            // Update form fields
            document.getElementById("first_name").value = data.profile.first_name || '';
            document.getElementById("last_name").value = data.profile.last_name || '';
            document.getElementById("email").value = data.profile.email || '';
            document.getElementById("phone").value = data.profile.phone || '';
            document.getElementById("address").value = data.profile.address || '';
            document.getElementById("bio").value = data.profile.bio || '';
            
            if (data.profile.date_of_birth) {
                const date = new Date(data.profile.date_of_birth);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById("date_of_birth").value = formattedDate;
            }
            
            document.getElementById("role_master").checked = data.profile.role_master || false;
            
            // Display approval status if available
            if (data.profile.approval_status) {
                const statusElement = document.getElementById('approval-status');
                statusElement.textContent = getStatusText(data.profile.approval_status);
                statusElement.className = `status-${data.profile.approval_status}`;
            }
            
            // Update notification badge
            if (data.unreadNotifications > 0) {
                const notificationBadge = document.getElementById('notifications-btn');
                notificationBadge.setAttribute('data-count', data.unreadNotifications);
                notificationBadge.classList.add('has-notifications');
            }
            
            // Update stats
            document.getElementById('rating-value').textContent = data.profile.rating || '0.0';
            document.getElementById('reviews-count').textContent = data.profile.reviews_count || '0';
            document.getElementById('orders-count').textContent = data.ordersCount || '0';
        }
    } catch (error) {
        showError(error.message);
    }
}

// Function to update profile header
function updateProfileHeader(profile) {
    // Set profile name
    const profileName = document.getElementById('profile-name');
    profileName.textContent = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile.username;
    
    // Set username
    document.getElementById('profile-username').textContent = `@${profile.username}`;
    
    // Set avatar initials
    const avatarInitials = document.getElementById('avatar-initials');
    if (profile.first_name && profile.last_name) {
        avatarInitials.textContent = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
    } else {
        avatarInitials.textContent = profile.username.charAt(0).toUpperCase();
    }
    
    // Set avatar image if available
    if (profile.profile_image_url) {
        const avatarImage = document.getElementById('avatar-image');
        avatarImage.src = profile.profile_image_url;
        avatarImage.style.display = 'block';
        avatarInitials.style.display = 'none';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'На розгляді';
        case 'approved': return 'Затверджено';
        case 'rejected': return 'Відхилено';
        default: return '';
    }
}

// Function to load user services
async function loadUserServices(userId) {
    try {
        const response = await fetch(`/services/${userId}`);
        
        if (!response.ok) {
            throw new Error('Не вдалося завантажити послуги');
        }
        
        const data = await response.json();
        
        if (data.services && data.services.length > 0) {
            // Reset all checkboxes
            document.querySelectorAll('#services input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Clear all textareas
            document.querySelectorAll('#services textarea').forEach(textarea => {
                textarea.value = '';
            });
            
            const selectedIndustries = [];
            
            data.services.forEach(service => {
                if (service.service_type === 'industry') {
                    const checkbox = Array.from(document.querySelectorAll('#services input[name="industry"]'))
                        .find(cb => cb.value === service.service_name);
                    
                    if (checkbox) {
                        checkbox.checked = true;
                        selectedIndustries.push(checkbox.dataset.industry);
                    }
                } else if (service.service_type.endsWith('-skills-text')) {
                    const textarea = document.getElementById(service.service_type);
                    if (textarea) {
                        textarea.value = service.service_name;
                    }
                } else if (service.service_type === 'custom-skills') {
                    document.getElementById('custom-skills').value = service.service_name;
                }
            });
            
            // Show industry-specific skills sections
            selectedIndustries.forEach(industry => {
                const skillsSection = document.getElementById(`${industry}-skills`);
                if (skillsSection) {
                    skillsSection.classList.add('visible');
                    // Add random animation class for initial load
                    const animations = ['slide-in-right', 'slide-in-left', 'slide-in-top', 'slide-in-bottom'];
                    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
                    skillsSection.classList.add(randomAnimation);
                }
            });
        }
    } catch (error) {
        showError(error.message);
    }
}

// Function to load user orders
async function loadUserOrders() {
    const userId = getUserId();
    if (!userId) return;
    
    const ordersContainer = document.getElementById('orders-container');
    const loadingElement = document.getElementById('orders-loading');
    
    ordersContainer.innerHTML = '';
    loadingElement.style.display = 'flex';
    
    try {
        const response = await fetch(`/orders/user/${userId}`);
        
        if (!response.ok) {
            throw new Error('Не вдалося завантажити замовлення');
        }
        
        const data = await response.json();
        
        loadingElement.style.display = 'none';
        
        if (data.orders && data.orders.length > 0) {
            // Update orders count
            document.getElementById('orders-count').textContent = data.orders.length;
            
            data.orders.forEach((order, index) => {
                // Add animation delay based on index
                const delay = index * 0.1;
                
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.style.animationDelay = `${delay}s`;
                
                const statusClass = `status-${order.status}`;
                const statusText = getOrderStatusText(order.status);
                
                orderCard.innerHTML = `
                    <div class="order-header">
                        <div class="order-number">${order.order_number}</div>
                        <div class="order-title">${order.title}</div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="order-body">
                        <div class="order-info">
                            <div class="order-info-item">
                                <div class="order-info-label">Галузь:</div>
                                <div class="order-info-value">${order.industry || 'Не вказано'}</div>
                            </div>
                            <div class="order-info-item">
                                <div class="order-info-label">Дата створення:</div>
                                <div class="order-info-value">${formatDate(order.created_at)}</div>
                            </div>
                            <div class="order-info-item">
                                <div class="order-info-label">Ціна:</div>
                                <div class="order-info-value">${order.price ? `${order.price} грн` : 'За домовленістю'}</div>
                            </div>
                            <div class="order-info-item">
                                <div class="order-info-label">Статус оплати:</div>
                                <div class="order-info-value">${getPaymentStatusText(order.payment_status)}</div>
                            </div>
                        </div>
                        <div class="order-actions">
                            <button onclick="viewOrderDetails(${order.id})"><i class="fas fa-eye"></i> Деталі</button>
                            ${order.status === 'completed' ? 
                                `<button onclick="leaveReview(${order.id}, ${order.master_id})"><i class="fas fa-star"></i> Відгук</button>` : 
                                ''}
                            ${order.status === 'pending' ? 
                                `<button onclick="cancelOrder(${order.id})"><i class="fas fa-times"></i> Скасувати</button>` : 
                                ''}
                        </div>
                    </div>
                `;
                
                ordersContainer.appendChild(orderCard);
            });
        } else {
            ordersContainer.innerHTML = '<p style="text-align: center; padding: 30px;">У вас ще немає замовлень</p>';
        }
    } catch (error) {
        loadingElement.style.display = 'none';
        ordersContainer.innerHTML = `<p style="text-align: center; padding: 30px; color: var(--danger-color);">Помилка: ${error.message}</p>`;
    }
}

// Function to load user reviews
async function loadUserReviews() {
    const userId = getUserId();
    if (!userId) return;
    
    const reviewsContainer = document.getElementById('reviews-container');
    const loadingElement = document.getElementById('reviews-loading');
    
    reviewsContainer.innerHTML = '';
    loadingElement.style.display = 'flex';
    
    try {
        const response = await fetch(`/reviews/master/${userId}`);
        
        if (!response.ok) {
            throw new Error('Не вдалося завантажити відгуки');
        }
        
        const data = await response.json();
        
        loadingElement.style.display = 'none';
        
        if (data.reviews && data.reviews.length > 0) {
            data.reviews.forEach((review, index) => {
                // Add animation delay based on index
                const delay = index * 0.1;
                
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                reviewCard.style.animationDelay = `${delay}s`;
                
                const reviewerName = review.user_first_name && review.user_last_name 
                    ? `${review.user_first_name} ${review.user_last_name}`
                    : review.user_username;
                
                const reviewerInitials = review.user_first_name && review.user_last_name
                    ? `${review.user_first_name.charAt(0)}${review.user_last_name.charAt(0)}`
                    : review.user_username.charAt(0).toUpperCase();
                
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar">${reviewerInitials}</div>
                            <div>
                                <div class="reviewer-name">${reviewerName}</div>
                                <div class="review-date">${formatDate(review.created_at)}</div>
                            </div>
                        </div>
                        <div class="review-rating">
                            ${generateStarRating(review.rating)}
                        </div>
                    </div>
                    <div class="review-content">
                        ${review.comment || 'Без коментаря'}
                    </div>
                    <div class="review-order">
                        Замовлення: ${review.order_title} (${review.order_number})
                    </div>
                `;
                
                reviewsContainer.appendChild(reviewCard);
            });
        } else {
            reviewsContainer.innerHTML = '<p style="text-align: center; padding: 30px;">У вас ще немає відгуків</p>';
        }
    } catch (error) {
        loadingElement.style.display = 'none';
        reviewsContainer.innerHTML = `<p style="text-align: center; padding: 30px; color: var(--danger-color);">Помилка: ${error.message}</p>`;
    }
}

// Helper function to generate star rating
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get order status text
function getOrderStatusText(status) {
    switch(status) {
        case 'pending': return 'Очікує';
        case 'approved': return 'Прийнято';
        case 'completed': return 'Виконано';
        case 'cancelled': return 'Скасовано';
        case 'rejected': return 'Відхилено';
        default: return status;
    }
}

// Helper function to get payment status text
function getPaymentStatusText(status) {
    switch(status) {
        case 'unpaid': return 'Не оплачено';
        case 'paid': return 'Оплачено';
        case 'refunded': return 'Повернуто';
        default: return status || 'Не оплачено';
    }
}

// Function to show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.display = 'flex';
    
    setTimeout(() => {
        errorElement.style.animation = 'fadeInScale 0.4s ease-out reverse';
        setTimeout(() => {
            errorElement.style.display = 'none';
            errorElement.style.animation = '';
        }, 400);
    }, 5000);
}

// Function to show success message
function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    successElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successElement.style.display = 'flex';
    
    setTimeout(() => {
        successElement.style.animation = 'fadeInScale 0.4s ease-out reverse';
        setTimeout(() => {
            successElement.style.display = 'none';
            successElement.style.animation = '';
        }, 400);
    }, 5000);
}

// Form submission handler
document.getElementById("profile-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const userId = getUserId();
    if (!userId) return;
    
    const formData = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        date_of_birth: document.getElementById("date_of_birth").value,
        bio: document.getElementById("bio").value,
        role_master: document.getElementById("role_master").checked,
        approval_status: document.getElementById("role_master").checked ? 'pending' : null
    };
    
    try {
        const profileResponse = await fetch(`/profile/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        
        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            throw new Error(errorData.message || 'Не вдалося оновити профіль');
        }
        
        // Update profile header
        updateProfileHeader({
            first_name: formData.first_name,
            last_name: formData.last_name,
            username: document.getElementById('profile-username').textContent.substring(1)
        });
        
        if (formData.role_master) {
            // Create master request if not already created
            try {
                await fetch(`/master-requests`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        user_id: userId,
                        status: 'pending'
                    })
                });
                
                // Update approval status display
                const statusElement = document.getElementById('approval-status');
                statusElement.textContent = 'На розгляді';
                statusElement.className = 'status-pending';
            } catch (err) {
                // Ignore error if request already exists
                console.log("Master request may already exist:", err);
            }
        }
        
        showSuccess('Профіль успішно оновлено!');
    } catch (error) {
        showError(error.message);
    }
});

// Save services handler
document.getElementById("save-services").addEventListener("click", async function () {
    const userId = getUserId();
    if (!userId) return;
    
    try {
        // Get selected industries
        const selectedIndustries = Array.from(
            document.querySelectorAll('#services input[name="industry"]:checked')
        ).map(checkbox => ({
            name: checkbox.value,
            type: 'industry',
            industry: checkbox.dataset.industry
        }));
        
        // Get skills texts for each selected industry
        const skillsTexts = [];
        selectedIndustries.forEach(industry => {
            const textareaId = `${industry.industry}-skills-text`;
            const textarea = document.getElementById(textareaId);
            if (textarea && textarea.value.trim()) {
                skillsTexts.push({
                    name: textarea.value,
                    type: textareaId
                });
            }
        });
        
        // Get custom skills
        const customSkills = document.getElementById('custom-skills').value;
        
        // Delete existing services
        const servicesResponse = await fetch(`/services/${userId}`);
        const servicesData = await servicesResponse.json();
        
        if (servicesData.services && servicesData.services.length > 0) {
            for (const service of servicesData.services) {
                await fetch(`/services/${service.id}`, {
                    method: "DELETE"
                });
            }
        }
        
        // Add industries
        for (const industry of selectedIndustries) {
            await fetch(`/services/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    service_name: industry.name,
                    service_type: industry.type
                })
            });
        }
        
        // Add skills texts
        for (const skill of skillsTexts) {
            await fetch(`/services/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    service_name: skill.name,
                    service_type: skill.type
                })
            });
        }
        
        // Add custom skills
        if (customSkills.trim()) {
            await fetch(`/services/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    service_name: customSkills,
                    service_type: 'custom-skills'
                })
            });
        }
        
        showSuccess('Послуги успішно збережено!');
    } catch (error) {
        showError(error.message);
    }
});

// Add animation for services toggle
document.getElementById("role_master").addEventListener("change", function () {
    const servicesDiv = document.getElementById("services");
    if (this.checked) {
        servicesDiv.style.display = "block";
        setTimeout(() => {
            servicesDiv.classList.add("visible");
        }, 10);
    } else {
        servicesDiv.classList.remove("visible");
        setTimeout(() => {
            servicesDiv.style.display = "none";
        }, 400);
        
        // Hide all industry skills sections
        document.querySelectorAll('.industry-skills').forEach(section => {
            section.classList.add('fade-out');
            setTimeout(() => {
                section.classList.remove('visible');
                section.classList.remove('fade-out');
                section.classList.remove('slide-in-right', 'slide-in-left', 'slide-in-top', 'slide-in-bottom');
            }, 400);
        });
    }
});

// Enhanced transitions for industry checkboxes
let lastActiveIndustry = null;

document.querySelectorAll('input[name="industry"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const industry = this.dataset.industry;
        const skillsSection = document.getElementById(`${industry}-skills`);
        
        if (this.checked && skillsSection) {
            // Determine animation direction based on position in the list
            const allIndustries = Array.from(document.querySelectorAll('input[name="industry"]'));
            const currentIndex = allIndustries.indexOf(this);
            
            // Remove all animation classes first
            skillsSection.classList.remove('slide-in-right', 'slide-in-left', 'slide-in-top', 'slide-in-bottom');
            
            // Add appropriate animation class
            if (lastActiveIndustry) {
                const lastIndex = allIndustries.findIndex(cb => cb.dataset.industry === lastActiveIndustry);
                
                if (currentIndex > lastIndex) {
                    skillsSection.classList.add('slide-in-right');
                } else {
                    skillsSection.classList.add('slide-in-left');
                }
            } else {
                skillsSection.classList.add('slide-in-bottom');
            }
            
            // Show the section with animation
            skillsSection.classList.add('visible');
            lastActiveIndustry = industry;
            
        } else if (skillsSection) {
            // Add fade out animation
            skillsSection.classList.add('fade-out');
            
            // Remove the section after animation completes
            setTimeout(() => {
                skillsSection.classList.remove('visible');
                skillsSection.classList.remove('fade-out');
                skillsSection.classList.remove('slide-in-right', 'slide-in-left', 'slide-in-top', 'slide-in-bottom');
                
                // Update last active industry
                const activeCheckboxes = Array.from(document.querySelectorAll('input[name="industry"]:checked'));
                if (activeCheckboxes.length > 0) {
                    lastActiveIndustry = activeCheckboxes[activeCheckboxes.length - 1].dataset.industry;
                } else {
                    lastActiveIndustry = null;
                }
            }, 400);
        }
    });
});

// Avatar upload functionality
document.getElementById('avatar-upload').addEventListener('click', function() {
    document.getElementById('avatar-input').click();
});

document.getElementById('avatar-input').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        showError('Будь ласка, виберіть зображення');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Розмір файлу не повинен перевищувати 5MB');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Upload avatar
        const response = await fetch(`/upload-avatar/${userId}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не вдалося завантажити аватар');
        }
        
        const data = await response.json();
        
        // Update avatar image
        const avatarImage = document.getElementById('avatar-image');
        avatarImage.src = data.imageUrl;
        avatarImage.style.display = 'block';
        document.getElementById('avatar-initials').style.display = 'none';
        
        // Update profile with new image URL
        await fetch(`/profile/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile_image_url: data.imageUrl })
        });
        
        showSuccess('Аватар успішно оновлено!');
    } catch (error) {
        showError(error.message);
    }
});

// Password strength checker
document.getElementById('new-password').addEventListener('input', function() {
    const password = this.value;
    const strengthBar = document.getElementById('password-strength');
    
    // Check requirements
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    // Update requirement indicators
    updateRequirement('req-length', hasLength);
    updateRequirement('req-uppercase', hasUppercase);
    updateRequirement('req-lowercase', hasLowercase);
    updateRequirement('req-number', hasNumber);
    updateRequirement('req-special', hasSpecial);
    
    // Calculate strength
    let strength = 0;
    if (hasLength) strength += 1;
    if (hasUppercase) strength += 1;
    if (hasLowercase) strength += 1;
    if (hasNumber) strength += 1;
    if (hasSpecial) strength += 1;
    
    // Update strength bar
    strengthBar.className = 'password-strength';
    if (strength < 3) {
        strengthBar.classList.add('password-strength-weak');
    } else if (strength < 5) {
        strengthBar.classList.add('password-strength-medium');
    } else {
        strengthBar.classList.add('password-strength-strong');
    }
});

function updateRequirement(id, isMet) {
    const element = document.getElementById(id);
    if (isMet) {
        element.classList.add('requirement-met');
        element.classList.remove('requirement-unmet');
        element.querySelector('i').className = 'fas fa-check-circle';
    } else {
        element.classList.add('requirement-unmet');
        element.classList.remove('requirement-met');
        element.querySelector('i').className = 'fas fa-times-circle';
    }
}

// Password change form handler
document.getElementById('password-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showError('Паролі не співпадають');
        return;
    }
    
    // Check password strength
    const hasLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    
    if (!(hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial)) {
        showError('Пароль не відповідає вимогам безпеки');
        return;
    }
    
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`/change-password/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не вдалося змінити пароль');
        }
        
        showSuccess('Пароль успішно змінено!');
        
        // Clear form
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        // Reset strength bar
        document.getElementById('password-strength').className = 'password-strength';
        
        // Reset requirements
        document.querySelectorAll('.requirement').forEach(req => {
            req.classList.remove('requirement-met', 'requirement-unmet');
            req.querySelector('i').className = 'fas fa-circle';
        });
    } catch (error) {
        showError(error.message);
    }
});

// Save settings handler
document.getElementById('save-settings').addEventListener('click', async function() {
    const userId = getUserId();
    if (!userId) return;
    
    const settings = {
        email_notifications: document.getElementById('email-notifications').checked,
        order_notifications: document.getElementById('order-notifications').checked,
        review_notifications: document.getElementById('review-notifications').checked
    };
    
    try {
        const response = await fetch(`/user-settings/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не вдалося зберегти налаштування');
        }
        
        showSuccess('Налаштування успішно збережено!');
    } catch (error) {
        showError(error.message);
    }
});

// Order action functions
window.viewOrderDetails = function(orderId) {
    window.location.href = `/order-details.html?id=${orderId}`;
};

window.leaveReview = function(orderId, masterId) {
    window.location.href = `/leave-review.html?orderId=${orderId}&masterId=${masterId}`;
};

window.cancelOrder = async function(orderId) {
    if (!confirm('Ви впевнені, що хочете скасувати це замовлення?')) {
        return;
    }
    
    try {
        const response = await fetch(`/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не вдалося скасувати замовлення');
        }
        
        showSuccess('Замовлення успішно скасовано!');
        
        // Reload orders
        setTimeout(() => {
            loadUserOrders();
        }, 1000);
    } catch (error) {
        showError(error.message);
    }
};

// Logout handler
document.getElementById("logout").addEventListener("click", function (event) {
    event.preventDefault();
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    window.location.href = "/auth.html";
});

// Load profile on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    
    // Check if we need to show a specific tab based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab) {
        const tabElement = document.querySelector(`.tab[data-tab="${tab}"]`);
        if (tabElement) {
            tabElement.click();
        }
    }
});