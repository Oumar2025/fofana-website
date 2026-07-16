// Load submissions
async function loadSubmissions() {
    try {
        const response = await fetch('/get-submissions');
        const data = await response.json();

        document.getElementById('totalSubmissions').textContent = data.length;

        const container = document.getElementById('submissionsContainer');

        if (data.length === 0) {
            container.innerHTML = '<p>Aucune soumission pour le moment.</p>';
            return;
        }

        container.innerHTML = data.map((submission, index) => {
            return `
                <div class="submission-card">
                    <h4>Soumission #${index + 1} - ${new Date(submission.timestamp).toLocaleDateString('fr-FR')}</h4>
                    <div class="submission-detail"><strong>Entreprise:</strong> ${submission.companyInfo.companyName}</div>
                    <div class="submission-detail"><strong>Année:</strong> ${submission.companyInfo.establishYear}</div>
                    <div class="submission-detail"><strong>Adresse:</strong> ${submission.companyInfo.companyAddress}</div>
                    <div class="submission-detail"><strong>Fournisseurs:</strong> ${submission.suppliers.length}</div>
                    <div style="margin-top: 10px;">
                        <button onclick="viewSubmission('${submission.id}')" class="btn-primary" style="margin-right: 10px;">Voir les détails</button>
                        <button onclick="downloadPDF('${submission.id}')" class="btn-secondary">📄 Télécharger PDF</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

// View submission details
function viewSubmission(id) {
    window.open(`/submission-details.html?id=${id}`, '_blank');
}

// Download PDF
function downloadPDF(id) {
    window.open(`/download-pdf/${id}`, '_blank');
}

// Logout function
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        window.location.href = 'index.html';
    }
}

// Load submissions on page load
document.addEventListener('DOMContentLoaded', loadSubmissions);