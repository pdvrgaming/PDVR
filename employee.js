// Employee Dashboard Functions
let pendingCustomers = [];
let myCustomers = [];
let todaysCustomers = [];

document.addEventListener('DOMContentLoaded', function () {
    if (!isAuthenticated() || isAdmin()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getCurrentUser();
    document.getElementById('employeeWelcome').textContent = `Welcome, ${user.name}`;

    // Show loading for data sections
    showDataLoading();

    // Load pending customers from localStorage
    loadPendingCustomers();

    // Load data in parallel
    Promise.all([
        loadMyCustomers(),
        loadTodaysCustomers()
    ]).finally(() => {
        hideDataLoading();
    });

    // Add customer form handler
    document.getElementById('addCustomerForm').addEventListener('submit', handleAddCustomer);

    updateCustomerCount();
});

// Show loading for data sections
function showDataLoading() {
    const todaysContainer = document.getElementById('todaysCustomersList');
    const myContainer = document.getElementById('myCustomersList');
    
    if (todaysContainer) todaysContainer.innerHTML = '<p style="text-align: center; color: #888;">Loading...</p>';
    if (myContainer) myContainer.innerHTML = '<p style="text-align: center; color: #888;">Loading...</p>';
}

// Hide loading for data sections
function hideDataLoading() {
    // Loading messages will be replaced by actual data when functions complete
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Update display when switching to view customers tab
    if (tabName === 'view-customers') {
        displayPendingCustomers();
    }
    
    // Update display when switching to my customers tab
    if (tabName === 'my-customers') {
        loadMyCustomers();
        displayMyCustomers();
    }
    
    // Update display when switching to today's customers tab
    if (tabName === 'todays-customers') {
        loadTodaysCustomers();
    }
}

function updatePrice() {
    const gameSelect = document.getElementById('gameName');
    const priceInput = document.getElementById('price');

    const selectedGame = gameSelect.value;
    if (selectedGame && gamePrices[selectedGame]) {
        priceInput.value = gamePrices[selectedGame];
    } else {
        priceInput.value = '';
    }
}

function handleAddCustomer(e) {
    e.preventDefault();

    const user = getCurrentUser();

    const customerData = {
        id: Date.now(), // Simple ID for local storage
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        location: document.getElementById('customerLocation').value,
        gameName: document.getElementById('gameName').value,
        price: parseInt(document.getElementById('price').value),
        paymentType: document.getElementById('paymentType').value,
        registeredBy: user.name,
        workplace: document.getElementById('customerLocation').value,
        date: formatDate(),
        isPaid: false
    };

    pendingCustomers.push(customerData);
    savePendingCustomers();

    // Reset form
    document.getElementById('addCustomerForm').reset();

    showToast('Customer added to pending list', 'success');
    updateCustomerCount();

    // Switch to view customers tab
    showTab('view-customers');
}

function loadPendingCustomers() {
    const saved = localStorage.getItem('pendingCustomers');
    if (saved) {
        pendingCustomers = JSON.parse(saved);
    }
}

function savePendingCustomers() {
    localStorage.setItem('pendingCustomers', JSON.stringify(pendingCustomers));
}

function displayPendingCustomers() {
    const container = document.getElementById('pendingCustomersList');

    if (pendingCustomers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No pending customers.</p>';
        updateTotalAmount();
        return;
    }

    container.innerHTML = pendingCustomers.map(customer => `
        <div class="customer-item" onclick="showCustomerDetails(${customer.id})">
            <div class="customer-basic">
                <div class="customer-name">${customer.name}</div>
                <div class="customer-game">${customer.gameName}</div>
            </div>
            <div class="customer-actions">
                <div class="customer-price">₹${customer.price}</div>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteCustomer(${customer.id})" title="Delete Customer">🗑️</button>
            </div>
        </div>
    `).join('');

    updateTotalAmount();
}

function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer?')) {
        pendingCustomers = pendingCustomers.filter(c => c.id !== customerId);
        savePendingCustomers();
        displayPendingCustomers();
        updateCustomerCount();
        showToast('Customer deleted successfully', 'success');
    }
}

function updateTotalAmount() {
    const total = pendingCustomers.reduce((sum, customer) => sum + customer.price, 0);
    document.getElementById('totalAmount').textContent = total;
}

function updateCustomerCount() {
    document.getElementById('customerCount').textContent = pendingCustomers.length;
}

function showCustomerDetails(customerId) {
    const customer = pendingCustomers.find(c => c.id === customerId);
    if (!customer) return;

    const detailsContent = document.getElementById('customerDetailsContent');
    detailsContent.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${customer.name}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${customer.phone}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${customer.location}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Game:</span>
            <span class="detail-value">${customer.gameName}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Price:</span>
            <span class="detail-value">₹${customer.price}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Payment Type:</span>
            <span class="detail-value">${customer.paymentType}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${customer.date}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Registered By:</span>
            <span class="detail-value">${customer.registeredBy}</span>
        </div>
    `;

    // Show/hide UPI button based on payment type
    const upiBtn = document.getElementById('generateUpiBtn');
    if (customer.paymentType === 'UPI') {
        upiBtn.style.display = 'inline-block';
        upiBtn.onclick = function() {
            generateUpiQr(customer.price, customer.name);
        };
    } else {
        upiBtn.style.display = 'none';
    }

    // Set up submit button
    document.getElementById('submitCustomerBtn').onclick = () => submitCustomer(customerId);

    showModal('customerDetailsModal');
}

async function submitCustomer(customerId) {
    const customer = pendingCustomers.find(c => c.id === customerId);
    if (!customer) return;

    try {
        // Submit to SheetDB
        const result = await SheetDBAPI.addCustomer({
            name: customer.name,
            phone: customer.phone,
            location: customer.location,
            gameName: customer.gameName,
            price: customer.price,
            paymentType: customer.paymentType,
            registeredBy: customer.registeredBy,
            workplace: customer.workplace,
            date: customer.date
        });

        // Remove from pending list
        pendingCustomers = pendingCustomers.filter(c => c.id !== customerId);
        savePendingCustomers();

        closeModal('customerDetailsModal');
        displayPendingCustomers();
        updateCustomerCount();

        // Hide any loading animations
        hideLoadingAnimation();

        showToast('Customer submitted successfully!', 'success');

        // Refresh today's customers and my customers data
        await loadTodaysCustomers();
        await loadMyCustomers();

        // Switch to my customers tab
        showTab('my-customers');

    } catch (error) {
        hideLoadingAnimation();
        showToast('Failed to submit customer', 'error');
    }
}

async function loadMyCustomers() {
    try {
        const user = getCurrentUser();
        const allCustomers = await SheetDBAPI.fetchCustomers();

        // Filter customers registered by current employee
        myCustomers = allCustomers.filter(customer =>
            String(customer.RegisteredBy) === String(user.name)
        );
        
        console.log('User name:', user.name);
        console.log('All customers:', allCustomers.length);
        console.log('My customers:', myCustomers.length);

        displayMyCustomers();
        updateMyCustomersAnalytics(myCustomers);
    } catch (error) {
        console.error('Error loading my customers:', error);
        myCustomers = [];
        displayMyCustomers();
        updateMyCustomersAnalytics([]);
    }
}

function displayMyCustomers() {
    const container = document.getElementById('myCustomersList');

    if (myCustomers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No customers found.</p>';
        return;
    }

    // Sort by date descending
    const sorted = [...myCustomers].sort((a, b) => {
        const dateA = parseCustomerDate(a.C_Date);
        const dateB = parseCustomerDate(b.C_Date);
        return dateB - dateA;
    });
    
    container.innerHTML = sorted.map(customer => `
        <div class="data-item">
            <div class="item-header">
                <div class="item-title customer-name-bold" style="text-align: center;">${customer.C_Name}</div>
                <div class="item-status">Paid</div>
            </div>
            <div class="item-details">
                <div class="item-detail">
                    <label>Phone</label>
                    <span>${customer.C_Phone}</span>
                </div>
                <div class="item-detail">
                    <label>Game</label>
                    <span>${customer.C_GameName}</span>
                </div>
                <div class="item-detail">
                    <label>Price</label>
                    <span>₹${customer.C_Price}</span>
                </div>
                <div class="item-detail">
                    <label>Payment</label>
                    <span>${customer.C_PaymentType}</span>
                </div>
                <div class="item-detail">
                    <label>Date</label>
                    <span>${formatLoadedDate(customer.C_Date)}</span>
                </div>
                <div class="item-detail">
                    <label>Workplace</label>
                    <span>${customer.C_WorkPlace}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatLoadedDate(dateStr) {
    // Handle ISO date format
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    // Handle existing format
    const date = new Date(dateStr);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

function filterMyCustomers() {
    const startDate = document.getElementById('myCustomersStartDate').value;
    const endDate = document.getElementById('myCustomersEndDate').value;

    if (!startDate && !endDate) {
        displayMyCustomers();
        updateMyCustomersAnalytics(myCustomers);
        return;
    }

    let filtered = myCustomers.filter(customer => {
        const customerDate = parseCustomerDate(customer.C_Date);
        customerDate.setHours(0, 0, 0, 0);
        
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        end.setHours(23, 59, 59, 999);
        
        return customerDate >= start && customerDate <= end;
    });
    
    // Sort by date descending
    filtered.sort((a, b) => {
        const dateA = parseCustomerDate(a.C_Date);
        const dateB = parseCustomerDate(b.C_Date);
        return dateB - dateA;
    });
    
    displayFilteredMyCustomers(filtered);
    updateMyCustomersAnalytics(filtered);
}

function parseCustomerDate(dateStr) {
    // Handle ISO date format (2025-09-09T18:30:00.000Z)
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr);
    }
    
    // Parse dd-MMM-yyyy format
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();

    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);

    return new Date(year, month, day);
}

function displayFilteredMyCustomers(filtered) {
    const container = document.getElementById('myCustomersList');

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No customers found for the selected date range.</p>';
        return;
    }

    container.innerHTML = filtered.map(customer => `
        <div class="data-item">
            <div class="item-header">
                <div class="item-title customer-name-bold" style="text-align: center;">${customer.C_Name}</div>
                <div class="item-status">Paid</div>
            </div>
            <div class="item-details">
                <div class="item-detail">
                    <label>Phone</label>
                    <span>${customer.C_Phone}</span>
                </div>
                <div class="item-detail">
                    <label>Game</label>
                    <span>${customer.C_GameName}</span>
                </div>
                <div class="item-detail">
                    <label>Price</label>
                    <span>₹${customer.C_Price}</span>
                </div>
                <div class="item-detail">
                    <label>Payment</label>
                    <span>${customer.C_PaymentType}</span>
                </div>
                <div class="item-detail">
                    <label>Date</label>
                    <span>${formatLoadedDate(customer.C_Date)}</span>
                </div>
                <div class="item-detail">
                    <label>Workplace</label>
                    <span>${customer.C_WorkPlace}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateMyCustomersAnalytics(data) {
    const totalCustomers = data.length;
    const totalRevenue = data.reduce((sum, customer) => sum + parseInt(customer.C_Price || 0), 0);

    const myTotalCustomersEl = document.getElementById('myTotalCustomers');
    const myTotalRevenueEl = document.getElementById('myTotalRevenue');
    
    if (myTotalCustomersEl) myTotalCustomersEl.textContent = totalCustomers;
    if (myTotalRevenueEl) myTotalRevenueEl.textContent = `₹${totalRevenue}`;
}

function resetMyCustomersFilter() {
    document.getElementById('myCustomersStartDate').value = '';
    document.getElementById('myCustomersEndDate').value = '';

    displayMyCustomers();
    updateMyCustomersAnalytics(myCustomers);
}

function showUpiModal() {
    showModal('upiModal');
}

// Today's Customers Functions
async function loadTodaysCustomers() {
    try {
        const user = getCurrentUser();
        const allCustomers = await SheetDBAPI.fetchCustomers();
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Filter customers registered by current employee today
        todaysCustomers = allCustomers.filter(customer => {
            if (String(customer.RegisteredBy) !== String(user.name)) return false;
            
            const customerDate = parseCustomerDate(customer.C_Date);
            customerDate.setHours(0, 0, 0, 0);
            
            return customerDate >= today && customerDate < tomorrow;
        });

        displayTodaysCustomers();
        updateTodaysCustomersAnalytics(todaysCustomers);
    } catch (error) {
        console.error('Error loading today\'s customers:', error);
        todaysCustomers = [];
        displayTodaysCustomers();
        updateTodaysCustomersAnalytics([]);
    }
}

function displayTodaysCustomers() {
    const container = document.getElementById('todaysCustomersList');

    if (todaysCustomers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No customers found for today.</p>';
        return;
    }

    // Sort by date descending (most recent first)
    const sorted = [...todaysCustomers].sort((a, b) => {
        const dateA = parseCustomerDate(a.C_Date);
        const dateB = parseCustomerDate(b.C_Date);
        return dateB - dateA;
    });
    
    container.innerHTML = sorted.map((customer, index) => `
        <div class="data-item customer-card" onclick="toggleTodaysCustomerDetails(${index})">
            <div class="item-header">
                <div class="customer-summary">
                    <div class="item-title" style="text-align: center;">${customer.C_Name}</div>
                    <div class="customer-basic-info">
                        <span class="customer-game">${customer.C_GameName}</span>
                        <span class="customer-price">₹${customer.C_Price}</span>
                        <span class="customer-date">${formatLoadedDate(customer.C_Date)}</span>
                    </div>
                </div>
                <div class="expand-icon" id="todays-icon-${index}">▼</div>
            </div>
            <div class="item-details" id="todays-details-${index}" style="display: none;">
                <div class="item-detail">
                    <label>Phone</label>
                    <span>${customer.C_Phone}</span>
                </div>
                <div class="item-detail">
                    <label>Game</label>
                    <span>${customer.C_GameName}</span>
                </div>
                <div class="item-detail">
                    <label>Price</label>
                    <span>₹${customer.C_Price}</span>
                </div>
                <div class="item-detail">
                    <label>Payment</label>
                    <span>${customer.C_PaymentType}</span>
                </div>
                <div class="item-detail">
                    <label>Date</label>
                    <span>${formatLoadedDate(customer.C_Date)}</span>
                </div>
                <div class="item-detail">
                    <label>Workplace</label>
                    <span>${customer.C_WorkPlace}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateTodaysCustomersAnalytics(data) {
    const totalCustomers = data.length;
    const totalRevenue = data.reduce((sum, customer) => sum + parseInt(customer.C_Price || 0), 0);
    
    // Filter by payment type
    const cashCustomers = data.filter(customer => customer.C_PaymentType === 'Cash');
    const upiCustomers = data.filter(customer => customer.C_PaymentType === 'UPI');
    
    const cashRevenue = cashCustomers.reduce((sum, customer) => sum + parseInt(customer.C_Price || 0), 0);
    const upiRevenue = upiCustomers.reduce((sum, customer) => sum + parseInt(customer.C_Price || 0), 0);

    const todaysTotalCustomersEl = document.getElementById('todaysTotalCustomers');
    const todaysTotalRevenueEl = document.getElementById('todaysTotalRevenue');
    const todaysCashRevenueEl = document.getElementById('todaysCashRevenue');
    const todaysUpiRevenueEl = document.getElementById('todaysUpiRevenue');
    
    if (todaysTotalCustomersEl) todaysTotalCustomersEl.textContent = totalCustomers;
    if (todaysTotalRevenueEl) todaysTotalRevenueEl.textContent = `₹${totalRevenue}`;
    if (todaysCashRevenueEl) todaysCashRevenueEl.textContent = `₹${cashRevenue}`;
    if (todaysUpiRevenueEl) todaysUpiRevenueEl.textContent = `₹${upiRevenue}`;
}

function formatTodaysTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function validatePhoneNumber() {
    const phoneInput = document.getElementById('customerPhone');
    const phoneValue = phoneInput.value;

    // Check if the phone number has exactly 10 digits
    if (/^\d{10}$/.test(phoneValue)) {
        phoneInput.setCustomValidity('');
    } else {
        phoneInput.setCustomValidity('Phone number must be exactly 10 digits.');
    }
}

// Refresh functions for buttons
function refreshTodaysCustomers() {
    const container = document.getElementById('todaysCustomersList');
    container.innerHTML = '<p style="text-align: center; color: #888;">Refreshing...</p>';
    loadTodaysCustomers();
}

function refreshMyCustomers() {
    const container = document.getElementById('myCustomersList');
    container.innerHTML = '<p style="text-align: center; color: #888;">Refreshing...</p>';
    loadMyCustomers();
}

// Toggle today's customer details
function toggleTodaysCustomerDetails(index) {
    const details = document.getElementById(`todays-details-${index}`);
    const icon = document.getElementById(`todays-icon-${index}`);
    
    if (details.style.display === 'none') {
        details.style.display = 'grid';
        icon.textContent = '▲';
    } else {
        details.style.display = 'none';
        icon.textContent = '▼';
    }
}
// Generate dynamic UPI QR code
function generateUpiQr(amount, customerName) {
    // Update modal content
    document.getElementById('upiAmount').textContent = amount;
    document.getElementById('upiAmountText').textContent = amount;
    
    // Generate QR using Google Charts API
    const qrContainer = document.getElementById('dynamicQrCode');
    const upiUrl = `upi://pay?pa=premkumar4399@ybl&pn=PDVR Gaming&am=${amount}&cu=INR&tn=Payment for ${customerName}`;
    
    qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUrl)}" alt="UPI QR Code" style="border: 2px solid #00ff88;">`;
    

    
    // Show modal
    document.getElementById('dynamicUpiModal').style.display = 'block';
}

// Setup payment app buttons
function setupPaymentButtons(amount) {
    const gpayBtn = document.getElementById('gpayBtn');
    const phonepeBtn = document.getElementById('phonepeBtn');
    
    // Google Pay deep link
    gpayBtn.onclick = function() {
        const gpayUrl = `tez://upi/pay?pa=premkumar4399@ybl&pn=PDVR Gaming&am=${amount}&cu=INR`;
        window.open(gpayUrl, '_blank');
    };
    
    // PhonePe deep link
    phonepeBtn.onclick = function() {
        const phonepeUrl = `phonepe://pay?pa=premkumar4399@ybl&pn=PDVR Gaming&am=${amount}&cu=INR`;
        window.open(phonepeUrl, '_blank');
    };
}