// Authentication Functions
function isAuthenticated() {
    return localStorage.getItem('user') !== null;
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && String(user.role) === 'admin'; // Explicitly treat role as string
}

function logout() {
    showLoading();
    localStorage.removeItem('user');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Show loading animation
function showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="vr-loading">
                <img src="1707900143828.png" alt="Loading" class="vr-headset" style="width: 300px; height: 300px; border-radius: 50%; object-fit: cover;">
                <div class="loading-text">Loading Dashboard...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

// Hide loading animation
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const loginId = String(document.getElementById('loginId').value); // Ensure loginId is a string
            const password = String(document.getElementById('password').value); // Ensure password is a string
            
            // Show loading animation
            showLoading();
            
            // Check admin credentials
            if (loginId === 'admin' && password === 'admin123') {
                const user = {
                    id: 'admin',
                    name: 'PDVR Gaming',
                    role: 'admin'
                };
                localStorage.setItem('user', JSON.stringify(user));
                
                // Simulate loading time for better UX
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
                return;
            }
            
            // Check employee credentials
            try {
                const employees = await SheetDBAPI.fetchEmployees();
                const employee = employees.find(emp => 
                    String(emp.E_ID) === loginId && String(emp.E_Password) === password // Ensure both are strings
                );
                
                if (employee) {
                    const user = {
                        id: String(employee.E_ID), // Ensure ID is treated as string
                        name: String(employee.E_Name), // Ensure Name is treated as string
                        phone: String(employee.E_Phone), // Ensure Phone is treated as string
                        workplace: String(employee.E_WorkPlace), // Ensure WorkPlace is treated as string
                        role: 'employee'
                    };
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Simulate loading time for better UX
                    setTimeout(() => {
                        window.location.href = 'employee-dashboard.html';
                    }, 1500);
                } else {
                    hideLoading();
                    showToast('Invalid credentials', 'error');
                }
            } catch (error) {
                hideLoading();
                showToast('Login failed. Please try again.', 'error');
            }
        });
    }
});

// Check authentication on protected pages
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = ['admin-dashboard.html', 'employee-dashboard.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Check role-based access
        if (currentPage === 'admin-dashboard.html' && !isAdmin()) {
            window.location.href = 'employee-dashboard.html';
            return;
        }
        
        if (currentPage === 'employee-dashboard.html' && isAdmin()) {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // Hide any existing loading overlay when page loads
        hideLoading();
    }
});
