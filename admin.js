// Admin Dashboard Functions
let employees = [];
let customers = [];

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    if (!isAuthenticated() || !isAdmin()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getCurrentUser();
    document.getElementById('adminWelcome').textContent = `Welcome, ${user.name}`;

    // Show loading animation while dashboard loads
    showDashboardLoading();

    // Load data and hide loading when complete
    Promise.all([
        loadEmployees(),
        loadCustomers()
    ]).then(() => {
        // Populate customer filters after data is loaded
        populateCustomerFilters();
        
        // Refresh employee display with customer counts
        displayEmployees();
        
        // Hide loading animation
        setTimeout(() => {
            hideDashboardLoading();
        }, 500);
    }).catch(() => {
        hideDashboardLoading();
    });

    // Add employee form handler - Simple approach
    setupAddEmployeeForm();
});

// Setup add employee form
function setupAddEmployeeForm() {
    const form = document.getElementById('addEmployeeForm');
    if (form) {
        // Remove any existing listeners
        form.removeEventListener('submit', handleAddEmployee);
        // Add new listener
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted!');
            handleAddEmployee(e);
        });
        console.log('Form listener attached');
    } else {
        console.error('Form not found');
    }
}

// Show dashboard loading animation
function showDashboardLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'dashboardLoadingOverlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="vr-loading">
                <img src="1707900143828.png" alt="Loading" class="vr-headset" style="width: 300px; height: 300px; border-radius: 50%; object-fit: cover;">
                <div class="loading-text">Loading Admin Dashboard...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

// Hide dashboard loading animation
function hideDashboardLoading() {
    const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Show the selected tab (Manage Employees / View Customers)
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
    
    if (tabName === 'customers') {
        resetCustomerFilters();
    }
}

// Load employee data
async function loadEmployees() {
    try {
        employees = await SheetDBAPI.fetchEmployees();
        displayEmployees(); // Display employees once data is loaded
        return Promise.resolve();
    } catch (error) {
        showToast('Failed to load employees', 'error');
        return Promise.reject(error);
    }
}

// Display the employee data in the employee tab
async function displayEmployees() {
    const container = document.getElementById('employeesList');

    if (employees.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No employees found.</p>';
        return;
    }

    // Ensure customers are loaded
    if (!customers || customers.length === 0) {
        await loadCustomers();
    }

    container.innerHTML = employees.map(employee => {
        // Count customers for this employee
        const employeeCustomers = customers ? customers.filter(customer => 
            String(customer.RegisteredBy) === String(employee.E_Name)
        ).length : 0;
        
        console.log(`Employee: ${employee.E_Name}, Customers found: ${employeeCustomers}`);
        
        return `
        <div class="data-item">
            <div class="item-header">
                <div class="item-title employee-name-bold">${employee.E_Name}</div>
                <div class="item-status">Active</div>
            </div>
            <div class="item-details">
                <div class="item-detail">
                    <label>Employee ID</label>
                    <span>${employee.E_ID}</span>
                </div>
                 <div class="item-detail">
                    <label>Employee Password</label>
                    <span>${employee.E_Password}</span>
                </div>
                <div class="item-detail">
                    <label>Phone</label>
                    <span>${employee.E_Phone}</span>
                </div>
                <div class="item-detail">
                    <label>Workplace</label>
                    <span>${employee.E_WorkPlace}</span>
                </div>
                <div class="item-detail">
                    <label>Total Customers</label>
                    <span class="customer-count">${employeeCustomers}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Load customer data
async function loadCustomers() {
    try {
        customers = await SheetDBAPI.fetchCustomers();
        displayCustomers(); // Display customers once data is loaded
        return Promise.resolve();
    } catch (error) {
        showToast('Failed to load customers', 'error');
        return Promise.reject(error);
    }
}

// Display all customers in the customers tab
function displayCustomers() {
    const container = document.getElementById('customersList');

    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No customers found.</p>';
        updateAnalytics(customers);
        return;
    }

    // Sort by date descending
    const sorted = [...customers].sort((a, b) => {
        const dateA = parseCustomerDate(a.C_Date);
        const dateB = parseCustomerDate(b.C_Date);
        return dateB - dateA;
    });
    
    container.innerHTML = sorted.map((customer, index) => `
        <div class="data-item customer-card" onclick="toggleCustomerDetails(${index})">
            <div class="item-header">
                <div class="customer-summary">
                    <div class="item-title" style="text-align: center;">${customer.C_Name}</div>
                    <div class="customer-basic-info">
                        <span class="customer-game">${customer.C_GameName}</span>
                        <span class="customer-price">₹${customer.C_Price}</span>
                        <span class="customer-date">${formatLoadedDate(customer.C_Date)}</span>
                    </div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="item-details" id="customer-details-${index}" style="display: none;">
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
                    <label>Registered By</label>
                    <span>${customer.RegisteredBy}</span>
                </div>
                <div class="item-detail">
                    <label>Workplace</label>
                    <span>${customer.C_WorkPlace}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    updateAnalytics(sorted);
}

// Filter the customers based on selected filters
function filterCustomers() {
    const employeeFilter = document.getElementById('customerEmployeeFilter').value;
    const workplaceFilter = document.getElementById('customerWorkplaceFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let filtered = [...customers];

    // Filter by employee
    if (employeeFilter) {
        filtered = filtered.filter(customer => customer.RegisteredBy === employeeFilter);
    }

    // Filter by workplace
    if (workplaceFilter) {
        filtered = filtered.filter(customer => customer.C_WorkPlace === workplaceFilter);
    }

    // Filter by date range
    if (startDate || endDate) {
        filtered = filtered.filter(customer => {
            const customerDate = parseCustomerDate(customer.C_Date);
            const start = startDate ? new Date(startDate) : new Date('1900-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-12-31');
            return customerDate >= start && customerDate <= end;
        });
    }

    // Sort by date descending
    filtered.sort((a, b) => {
        const dateA = parseCustomerDate(a.C_Date);
        const dateB = parseCustomerDate(b.C_Date);
        return dateB - dateA;
    });
    
    // Display the filtered customers
    displayFilteredCustomers(filtered);
    updateAnalytics(filtered); // Update the analytics after filtering
}

// Helper function to parse date from dd-MMM-yyyy format
function parseCustomerDate(dateStr) {
    // Handle ISO date format (2025-09-09T18:30:00.000Z)
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr);
    }
    
    // Handle dd-MMM-yyyy format
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

// Display the filtered customers in the customers tab
function displayFilteredCustomers(filtered) {
    const container = document.getElementById('customersList');

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No customers found for the selected filters.</p>';
        return;
    }

    container.innerHTML = filtered.map((customer, index) => `
        <div class="data-item customer-card" onclick="toggleCustomerDetails('filtered-${index}')">
            <div class="item-header">
                <div class="customer-summary">
                    <div class="item-title" style="text-align: center;">${customer.C_Name}</div>
                    <div class="customer-basic-info">
                        <span class="customer-game">${customer.C_GameName}</span>
                        <span class="customer-price">₹${customer.C_Price}</span>
                        <span class="customer-date">${formatLoadedDate(customer.C_Date)}</span>
                    </div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="item-details" id="customer-details-filtered-${index}" style="display: none;">
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
                    <label>Registered By</label>
                    <span>${customer.RegisteredBy}</span>
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

// Update analytics (Total Customers and Total Revenue)
function updateAnalytics(data) {
    const totalCustomers = data.length;
    const totalRevenue = data.reduce((sum, customer) => sum + parseInt(customer.C_Price || 0), 0);

    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue}`;
}

function showAddEmployeeModal() {
    console.log('Opening add employee modal');
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Direct function to add employee
function addEmployeeNow() {
    console.log('Add employee button clicked!');
    
    const name = document.getElementById('empName').value;
    const phone = document.getElementById('empPhone').value;
    const id = document.getElementById('empId').value;
    const password = document.getElementById('empPassword').value;
    const workplace = document.getElementById('empWorkplace').value;
    
    if (!name || !phone || !id || !password || !workplace) {
        alert('Please fill all fields');
        return;
    }
    
    // Check for duplicate employee in same workplace
    console.log('Checking duplicates against:', employees.length, 'employees');
    
    for (let emp of employees) {
        if (String(emp.E_Name) === String(name) && 
            String(emp.E_Phone) === String(phone) && 
            String(emp.E_ID) === String(id) && 
            String(emp.E_Password) === String(password) && 
            String(emp.E_WorkPlace) === String(workplace)) {
            alert('This employee already exists in ' + workplace + '!');
            return;
        }
    }
    
    const employeeData = { name, phone, id, password, workplace };
    
    SheetDBAPI.addEmployee(employeeData)
        .then(() => {
            alert('Employee added successfully!');
            closeModal('addEmployeeModal');
            loadEmployees();
        })
        .catch(error => {
            alert('Failed to add employee: ' + error.message);
        });
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close modal
function closeModal(modalId) {
    console.log('Closing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        if (modalId === 'credentialMismatchModal') {
            modal.remove();
        }
        if (modalId === 'addEmployeeModal') {
            const form = document.getElementById('addEmployeeForm');
            if (form) form.reset();
        }
    }
    
    // Reset form field highlights
    const formFields = ['empName', 'empPhone', 'empId', 'empPassword', 'empWorkplace'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.style.borderColor = '';
    });
}

async function handleAddEmployee(e) {
    e.preventDefault();
    console.log('Add employee form submitted');

    const employeeData = {
        name: document.getElementById('empName').value.trim(),
        phone: document.getElementById('empPhone').value.trim(),
        id: document.getElementById('empId').value.trim(),
        password: document.getElementById('empPassword').value.trim(),
        workplace: document.getElementById('empWorkplace').value.trim()
    };
    
    console.log('Employee data:', employeeData);

    // Check for missing credentials
    const missingCredentials = [];
    if (!employeeData.name) missingCredentials.push('Name');
    if (!employeeData.phone) missingCredentials.push('Phone');
    if (!employeeData.id) missingCredentials.push('Employee ID');
    if (!employeeData.password) missingCredentials.push('Password');
    if (!employeeData.workplace) missingCredentials.push('Workplace');

    if (missingCredentials.length > 0) {
        showToast(`Missing credentials: ${missingCredentials.join(', ')}. Please fill all fields.`, 'error');
        highlightMissingFields(missingCredentials);
        return;
    }

    // Check if employee with same name already exists
    const existingEmployee = employees.find(emp => 
        emp.E_Name.toLowerCase() === employeeData.name.toLowerCase()
    );

    if (existingEmployee) {
        // Employee exists, check if credentials match
        const credentialMismatches = [];
        if (existingEmployee.E_Phone !== employeeData.phone) credentialMismatches.push('Phone');
        if (existingEmployee.E_ID !== employeeData.id) credentialMismatches.push('Employee ID');
        if (existingEmployee.E_Password !== employeeData.password) credentialMismatches.push('Password');
        if (existingEmployee.E_WorkPlace !== employeeData.workplace) credentialMismatches.push('Workplace');

        if (credentialMismatches.length > 0) {
            showCredentialMismatchModal(existingEmployee, employeeData, credentialMismatches);
            return;
        } else {
            showToast('Employee with identical credentials already exists!', 'error');
            return;
        }
    }

    // Check for duplicate credentials with other employees
    const duplicateChecks = [
        { field: 'E_ID', value: employeeData.id, name: 'Employee ID' },
        { field: 'E_Phone', value: employeeData.phone, name: 'Phone' },
        { field: 'E_Password', value: employeeData.password, name: 'Password' }
    ];

    const duplicates = duplicateChecks.filter(check => 
        employees.some(emp => emp[check.field] === check.value)
    );

    if (duplicates.length > 0) {
        const duplicateFields = duplicates.map(d => d.name).join(', ');
        showToast(`Duplicate credentials found: ${duplicateFields}. Please use unique values.`, 'error');
        return;
    }
    
    try {
        console.log('Calling API to add employee...');
        await SheetDBAPI.addEmployee(employeeData);
        showToast('Employee added successfully!', 'success');
        closeModal('addEmployeeModal');
        loadEmployees();
    } catch (error) {
        console.error('Error adding employee:', error);
        showToast('Failed to add employee: ' + error.message, 'error');
    }
}

// Highlight missing fields
function highlightMissingFields(missingCredentials) {
    const fieldMap = {
        'Name': 'empName',
        'Phone': 'empPhone', 
        'Employee ID': 'empId',
        'Password': 'empPassword',
        'Workplace': 'empWorkplace'
    };

    // Reset all field styles
    Object.values(fieldMap).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.style.borderColor = '';
    });

    // Highlight missing fields
    missingCredentials.forEach(credential => {
        const fieldId = fieldMap[credential];
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            field.focus();
        }
    });
}

// Show credential mismatch modal
function showCredentialMismatchModal(existingEmployee, newData, mismatches) {
    const modal = document.createElement('div');
    modal.id = 'credentialMismatchModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Credential Mismatch Detected</h3>
                <span class="close" onclick="closeModal('credentialMismatchModal')">&times;</span>
            </div>
            <div style="padding: 1.5rem;">
                <p style="color: #ff6b00; margin-bottom: 1rem;">Employee "${existingEmployee.E_Name}" already exists with different credentials:</p>
                
                <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                    ${mismatches.includes('Phone') ? `
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 5px;">
                            <strong>Phone:</strong><br>
                            Existing: ${existingEmployee.E_Phone}<br>
                            New: ${newData.phone}
                        </div>
                    ` : ''}
                    ${mismatches.includes('Employee ID') ? `
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 5px;">
                            <strong>Employee ID:</strong><br>
                            Existing: ${existingEmployee.E_ID}<br>
                            New: ${newData.id}
                        </div>
                    ` : ''}
                    ${mismatches.includes('Password') ? `
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 5px;">
                            <strong>Password:</strong><br>
                            Existing: ${existingEmployee.E_Password}<br>
                            New: ${newData.password}
                        </div>
                    ` : ''}
                    ${mismatches.includes('Workplace') ? `
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 5px;">
                            <strong>Workplace:</strong><br>
                            Existing: ${existingEmployee.E_WorkPlace}<br>
                            New: ${newData.workplace}
                        </div>
                    ` : ''}
                </div>
                
                <p style="color: #ccc; margin-bottom: 1.5rem;">Please choose an action:</p>
                <div style="background: rgba(0,255,136,0.1); padding: 1rem; border-radius: 5px; border-left: 3px solid #00ff88;">
                    <strong style="color: #00ff88;">Recommendation:</strong> If this is the same person, update their existing credentials. If this is a different person, use a unique name.
                </div>
            </div>
            <div class="form-actions">
                <button onclick="closeModal('credentialMismatchModal')" class="btn btn-secondary">Cancel</button>
                <button onclick="updateExistingCredentials('${existingEmployee.E_Name}')" class="btn btn-primary">Update Existing Employee</button>
                <button onclick="addWithDifferentName()" class="btn btn-accent">Add as New Employee</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Update existing employee credentials
function updateExistingCredentials(employeeName) {
    showToast('Feature to update existing employee credentials will be implemented in next version.', 'info');
    closeModal('credentialMismatchModal');
}

// Add with different name
function addWithDifferentName() {
    closeModal('credentialMismatchModal');
    showToast('Please modify the employee name to make it unique.', 'info');
    document.getElementById('empName').focus();
    document.getElementById('empName').style.borderColor = '#ff6b00';
}

// Toggle customer details
function toggleCustomerDetails(customerId) {
    const details = document.getElementById(`customer-details-${customerId}`);
    const icon = event.currentTarget.querySelector('.expand-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'grid';
        icon.textContent = '▲';
    } else {
        details.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Populate employee dropdown and filter workplaces based on selected employee
function populateCustomerFilters() {
    const employeeFilter = document.getElementById('customerEmployeeFilter');

    // Get unique employee names from employees list
    const allEmployeeNames = [...new Set(employees.map(emp => emp.E_Name))].sort();

    // Populate employee dropdown with all employees
    employeeFilter.innerHTML = `<option value="">All Employees</option>` + 
                               allEmployeeNames.map(employee => 
                                   `<option value="${employee}">${employee}</option>`
                               ).join('');

    // Initialize workplace filter with all workplaces
    updateWorkplaceFilter();
}

// Update workplace filter based on selected employee
function updateWorkplaceFilter() {
    const selectedEmployee = document.getElementById('customerEmployeeFilter').value;
    const workplaceFilter = document.getElementById('customerWorkplaceFilter');
    
    let workplaces;
    
    if (selectedEmployee) {
        // Show only workplaces where this employee worked
        workplaces = [...new Set(
            customers
                .filter(c => c.RegisteredBy === selectedEmployee)
                .map(c => c.C_WorkPlace)
        )].filter(Boolean).sort();
    } else {
        // Show all workplaces when no employee is selected
        workplaces = [...new Set(customers.map(c => c.C_WorkPlace))].filter(Boolean).sort();
    }
    
    workplaceFilter.innerHTML = `<option value="">All Workplaces</option>` + 
                               workplaces.map(workplace => 
                                   `<option value="${workplace}">${workplace}</option>`
                               ).join('');
    
    // Apply filters after updating workplace options
    filterCustomers();
}

// Reset customer filters
function resetCustomerFilters() {
    document.getElementById('customerEmployeeFilter').value = '';
    document.getElementById('customerWorkplaceFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    displayCustomers();
}

function validatePhoneNumber() {
    const phoneInput = document.getElementById('empPhone');
    const phoneValue = phoneInput.value;

    // Reset border color
    phoneInput.style.borderColor = '';

    // Check if the phone number has exactly 10 digits
    if (/^\d{10}$/.test(phoneValue)) {
        phoneInput.setCustomValidity('');
    } else {
        phoneInput.setCustomValidity('Phone number must be exactly 10 digits.');
    }
}

// Check employee ID in real-time
function checkEmployeeId() {
    const empIdInput = document.getElementById('empId');
    const empIdValue = empIdInput.value.trim();
    const workplace = document.getElementById('empWorkplace').value.trim();
    const name = document.getElementById('empName').value.trim();
    const phone = document.getElementById('empPhone').value.trim();
    const password = document.getElementById('empPassword').value.trim();
    
    if (!empIdValue || !workplace) {
        empIdInput.style.borderColor = '';
        return;
    }
    
    // Check if exact same employee exists in same workplace
    const exists = employees.some(emp => 
        String(emp.E_Name) === String(name) && 
        String(emp.E_Phone) === String(phone) && 
        String(emp.E_ID) === String(empIdValue) && 
        String(emp.E_Password) === String(password) && 
        String(emp.E_WorkPlace) === String(workplace)
    );
    
    if (exists) {
        empIdInput.style.borderColor = '#dc3545';
        empIdInput.title = 'This exact employee already exists in ' + workplace;
    } else {
        empIdInput.style.borderColor = '#28a745';
        empIdInput.title = 'Employee can be added to ' + workplace;
    }
}