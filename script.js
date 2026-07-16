// Add supplier functionality
let supplierCount = 1;

function addSupplier() {
    supplierCount++;
    const container = document.getElementById('supplierContainer');
    const newSupplier = document.createElement('div');
    newSupplier.className = 'supplier-entry';
    newSupplier.innerHTML = `
        <div class="form-group">
            <label>Nom de l'entreprise *</label>
            <input type="text" class="supplier-name" required>
        </div>
        <div class="form-group">
            <label>Pays *</label>
            <input type="text" class="supplier-country" required>
        </div>
        <div class="form-group">
            <label>Ville *</label>
            <input type="text" class="supplier-city" required>
        </div>
        <div class="form-group">
            <label>Personne de contact (si possible)</label>
            <input type="text" class="supplier-contact">
        </div>
        <div class="form-group">
            <label>Produits fournis * (les produits que vous exportez de ce pays mentionné !)</label>
            <input type="text" class="supplier-products" required>
        </div>
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">Supprimer</button>
    `;
    container.appendChild(newSupplier);
}

// Form submission
document.getElementById('companyForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Envoi en cours...';
    submitBtn.disabled = true;

    // Get all supplier data
    const supplierEntries = document.querySelectorAll('.supplier-entry');
    const suppliers = Array.from(supplierEntries).map(entry => ({
        companyName: entry.querySelector('.supplier-name').value,
        country: entry.querySelector('.supplier-country').value,
        city: entry.querySelector('.supplier-city').value,
        contact: entry.querySelector('.supplier-contact').value || 'Non spécifié',
        products: entry.querySelector('.supplier-products').value
    }));

    // Build form data
    const formData = {
        companyInfo: {
            companyName: document.getElementById('companyName').value,
            establishYear: document.getElementById('establishYear').value,
            companyAddress: document.getElementById('companyAddress').value,
            warehouseLocations: document.getElementById('warehouseLocations').value
        },
        suppliers: suppliers,
        importInfo: {
            products: document.getElementById('importProducts').value,
            quantity: document.getElementById('importQuantity').value,
            frequency: document.getElementById('importFrequency').value,
            shippingTime: document.getElementById('shippingTime').value,
            shippingMethod: document.getElementById('shippingMethod').value
        },
        salesInfo: {
            fastestSelling: document.getElementById('fastestSelling').value,
            slowestSelling: document.getElementById('slowestSelling').value,
            highestProfit: document.getElementById('highestProfit').value,
            expireProducts: document.getElementById('expireProducts').value || 'Aucun'
        },
        customers: {
            countries: document.getElementById('customerCountries').value,
            biggestCustomers: document.getElementById('biggestCustomers').value,
            salesType: document.getElementById('salesType').value
        },
        warehouses: {
            count: document.getElementById('warehouseCount').value,
            capacity: document.getElementById('storageCapacity').value,
            locations: document.getElementById('warehouseLocations').value,
            products: document.getElementById('warehouseProducts').value
        },
        challenges: {
            mainProblems: document.getElementById('mainProblems').value,
            timeConsumingTasks: document.getElementById('timeConsumingTasks').value,
            difficultDecisions: document.getElementById('difficultDecisions').value,
            aiExpectations: document.getElementById('aiExpectations').value
        }
    };

    // Send to server
    try {
        const response = await fetch('/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to success page
            window.location.href = '/success.html?success=true';
        } else {
            alert('Erreur lors de la soumission du formulaire. Veuillez réessayer.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur de connexion. Veuillez réessayer.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});