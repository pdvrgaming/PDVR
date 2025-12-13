let currentEditingCustomer = null;

function updateGamePrice() {
    const gameSelect = document.getElementById('editGameName');
    const priceInput = document.getElementById('editPrice');
    
    const prices = {
        'Roller Coster': 100,
        'Santa Ride': 100,
        'Henry': 100,
        'Jurasic Park': 150,
        'Beat Saber': 150,
        'Iron Man': 150,
        'Richies Plank': 150,
        'Boxing': 150,
        'Horror': 150,
        'Cricket': 150,
        'Solar System': 300,
        'Ocean Rift': 300,
        'Mission ISS': 300,
        'Anotamy': 300
    };
    
    priceInput.value = prices[gameSelect.value] || 100;
}

function editCustomer() {
    const customerData = getCurrentCustomerData();
    if (!customerData) return;
    
    currentEditingCustomer = customerData;
    
    // Close current modal and open edit modal
    closeModal('customerDetailsModal');
    document.getElementById('editCustomerModal').style.display = 'block';
    
    // Populate edit form with current data
    document.getElementById('editCustomerName').value = customerData.name;
    document.getElementById('editCustomerPhone').value = customerData.phone;
    document.getElementById('editCustomerLocation').value = customerData.location;
    document.getElementById('editGameName').value = customerData.game;
    document.getElementById('editPaymentType').value = customerData.paymentType;
    
    // Update price based on game
    updateGamePrice();
}

function getCurrentCustomerData() {
    // Get customer data from the currently open modal
    const modal = document.getElementById('customerDetailsModal');
    if (!modal || modal.style.display === 'none') return null;
    
    const content = document.getElementById('customerDetailsContent');
    const details = content.querySelectorAll('.detail-value');
    
    // Find the customer ID from the submit button's onclick
    const submitBtn = document.getElementById('submitCustomerBtn');
    const onclickStr = submitBtn.getAttribute('onclick');
    const idMatch = onclickStr.match(/submitCustomer\((\d+)\)/);
    const customerId = idMatch ? parseInt(idMatch[1]) : null;
    
    return {
        id: customerId,
        name: details[0]?.textContent || '',
        phone: details[1]?.textContent || '',
        location: details[2]?.textContent || '',
        game: details[3]?.textContent || '',
        price: details[4]?.textContent?.replace('₹', '') || '',
        paymentType: details[5]?.textContent || ''
    };
}

function updateEditPrice() {
    console.log('updateEditPrice called');
    const gameSelect = document.getElementById('editGameName');
    const priceInput = document.getElementById('editPrice');
    
    if (!gameSelect || !priceInput) {
        console.log('Elements not found');
        return;
    }
    
    const selectedGame = gameSelect.value;
    console.log('Selected game:', selectedGame);
    
    const gamePrices = {
        'Roller Coster': 100,
        'Santa Ride': 100,
        'Henry': 100,
        'Jurasic Park': 100,
        'Beat Saber': 100,
        'Iron Man': 100,
        'Richies Plank': 100,
        'Boxing': 100,
        'Horror': 100,
        'Cricket': 100,
        'Solar System': 100,
        'Ocean Rift': 100,
        'Mission ISS': 100,
        'Anotamy': 100
    };
    
    const price = gamePrices[selectedGame] || 100;
    console.log('Setting price to:', price);
    priceInput.value = price;
}

function saveCustomerChanges() {
    const updatedData = {
        name: document.getElementById('editCustomerName').value.toUpperCase(),
        phone: document.getElementById('editCustomerPhone').value,
        location: document.getElementById('editCustomerLocation').value,
        game: document.getElementById('editGameName').value,
        price: document.getElementById('editPrice').value,
        paymentType: document.getElementById('editPaymentType').value
    };
    
    // Update the customer in localStorage
    updateCustomerInStorage(currentEditingCustomer, updatedData);
    
    // Close edit modal
    closeModal('editCustomerModal');
    
    // Refresh the pending customers list
    displayPendingCustomers();
    updateTotalAmount();
    updateCustomerCount();
    
    showToast('Customer details updated successfully!', 'success');
}

function updateCustomerInStorage(originalData, updatedData) {
    let pendingCustomers = JSON.parse(localStorage.getItem('pendingCustomers') || '[]');
    
    const index = pendingCustomers.findIndex(customer => 
        customer.id === currentEditingCustomer.id
    );
    
    if (index !== -1) {
        pendingCustomers[index] = {
            ...pendingCustomers[index],
            name: updatedData.name,
            phone: updatedData.phone,
            location: updatedData.location,
            gameName: updatedData.game,
            price: parseInt(updatedData.price),
            paymentType: updatedData.paymentType
        };
        localStorage.setItem('pendingCustomers', JSON.stringify(pendingCustomers));
        
        // Update the global pendingCustomers array
        window.pendingCustomers = pendingCustomers;
    }
}