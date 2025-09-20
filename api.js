// SheetDB API Configuration
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz4-rkcvh4lGwYjXXHbcBN4IJnN9cktARVGgTU8zuJkp4_bCrqkix4V_2B9NaFrESgP/exec';
const EMPLOYEES_ENDPOINT = `${API_BASE_URL}?sheet=Employees`;
const CUSTOMERS_ENDPOINT = `${API_BASE_URL}?sheet=Customers`;

// API Functions
class SheetDBAPI {
    static async fetchEmployees() {
        try {
            
            const response = await fetch(EMPLOYEES_ENDPOINT);
            if (!response.ok) throw new Error('Failed to fetch employees');
            return await response.json();
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    }

    static async addEmployee(employeeData) {
        try {
            // Show loading animation
            showLoadingAnimation();
            
            // Ensure all data is treated as strings
            const csvData = [
                String(employeeData.name).toUpperCase(),
                String(employeeData.phone),
                String(employeeData.id),
                String(employeeData.password),
                String(employeeData.workplace)
            ].join(',');

            const response = await fetch(EMPLOYEES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: csvData
            });

            const result = await response.text();
            
            // Hide loading animation
            hideLoadingAnimation();
            
            if (result !== 'success') throw new Error('Failed to add employee');

            return { success: true, message: 'Employee added successfully' };
        } catch (error) {
            console.error('Error adding employee:', error);
            hideLoadingAnimation();
            throw error;
        }
    }

    static async fetchCustomers() {
        try {
           
            const response = await fetch(CUSTOMERS_ENDPOINT);
            if (!response.ok) throw new Error('Failed to fetch customers');
            return await response.json();
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }

     static async addCustomer(customerData) {
        try {
            // Show loading animation
            showLoadingAnimation();

            // Ensure all data is treated as strings
            const csvData = [
                String(customerData.name).toUpperCase(),
                String(customerData.phone),                
                String(customerData.gameName),
                String(customerData.price),
                String(customerData.paymentType),
                String(customerData.registeredBy).toUpperCase(),
                String(customerData.workplace),
                String(customerData.date)
            ].join(',');

            const response = await fetch(CUSTOMERS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: csvData
            });

            const result = await response.text();
            
            // Always hide loading animation
            hideLoadingAnimation();
            
            if (result !== 'success') throw new Error('Failed to add customer');

            return { success: true, message: 'Customer added successfully' };
        } catch (error) {
            console.error('Error adding customer:', error);
            // Always hide loading animation on error
            hideLoadingAnimation();
            throw error;
        }
    }
}

// Utility Functions
function formatDate() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Loading Animation Functions
function showLoadingAnimation() {
    let loadingDiv = document.getElementById('loadingAnimation');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingAnimation';
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="vr-loading">
                    <img src="1707900143828.png" alt="Loading" class="vr-headset" style="width: 300px; height: 300px; border-radius: 50%; object-fit: cover;">
                    <div class="loading-text">Processing...</div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.style.display = 'flex';
}

function hideLoadingAnimation() {
    const loadingDiv = document.getElementById('loadingAnimation');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Game prices configuration
const gamePrices = {
    "Roller Coster": 100,
    "Santa Ride": 100,
    "Henry": 100,
    "Jurasic Park": 150,
    "Beat Saber": 150,
    "Iron Man": 150,
    "Richies Plank": 150,
    "Boxing": 150,
    "Horror": 150,
    "Cricket": 150,
    "Solar System": 300,
    "Ocean Rift": 300,
    "Mission ISS": 300,
    "Anotamy": 300
};

// Modal event handlers
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}