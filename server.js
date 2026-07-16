const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Create directories if they don't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const pdfDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

// ==================== EMAIL CONFIGURATION (Brevo) ====================
// ==================== EMAIL CONFIGURATION (Brevo) ====================
const EMAIL_USER = process.env.EMAIL_USER || 'b23e48001@smtp-brevo.com'; // Use Brevo SMTP login
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_TO = process.env.EMAIL_TO || 'f.oumarou78@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'hp.oumaroulife2023@gmail.com';

console.log('📧 Email configuration:');
console.log(`   User: ${EMAIL_USER}`);
console.log(`   To: ${EMAIL_TO}`);

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    debug: false, // Set to true for debugging
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email connection
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ Email configuration error:');
        console.log(error.message);
        console.log('⚠️  Email will be disabled but the app will continue to work');
        console.log('📧 You can still download PDFs from the admin panel');
    } else {
        console.log('✅ Email configured successfully with Brevo!');
    }
});
// ============================================================
// ============================================================

// Route to save form data
app.post('/submit-form', async (req, res) => {
    const formData = req.body;

    // Read existing data
    let existingData = [];
    try {
        const dataFile = path.join(__dirname, 'data', 'submissions.json');
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            existingData = JSON.parse(fileContent);
        }
    } catch (error) {
        console.error('Error reading data file:', error);
    }

    // Add new submission with timestamp
    formData.timestamp = new Date().toISOString();
    formData.id = Date.now().toString();
    existingData.push(formData);

    // Save to file
    try {
        const dataFile = path.join(__dirname, 'data', 'submissions.json');
        fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

        // Generate PDF
        const pdfPath = await generatePDF(formData);

        // Try to send email but don't fail if it doesn't work
        try {
            await sendEmailWithPDF(formData, pdfPath);
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Email error (non-critical):', emailError.message);
            // Email failed but we don't stop the process
        }

        res.json({
            success: true,
            message: 'Formulaire soumis avec succès!',
            pdfPath: pdfPath
        });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la soumission' });
    }
});

// Function to send email with PDF
async function sendEmailWithPDF(formData, pdfPath) {
    const companyName = formData.companyInfo.companyName || 'Client';

    const mailOptions = {
        from: `"FOFANA Confiserie" <${EMAIL_FROM}>`,
        to: EMAIL_TO,
        subject: `📋 Nouvelle soumission - ${companyName} - FOFANA Confiserie`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍫 FOFANA CONFISERIE</h1>
                        <p style="margin: 0;">Nouvelle soumission reçue</p>
                    </div>
                    <div class="content">
                        <h2>📊 Récapitulatif de la soumission</h2>
                        
                        <div class="info-box">
                            <p><strong>🏢 Entreprise:</strong> ${formData.companyInfo.companyName}</p>
                            <p><strong>📅 Année de création:</strong> ${formData.companyInfo.establishYear}</p>
                            <p><strong>📍 Adresse:</strong> ${formData.companyInfo.companyAddress}</p>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>📦 Nombre de fournisseurs:</strong> ${formData.suppliers.length}</p>
                            <p><strong>🚚 Produits importés:</strong> ${formData.importInfo.products}</p>
                            <p><strong>📊 Fréquence d'importation:</strong> ${formData.importInfo.frequency}</p>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>⚡ Produits les plus vendus:</strong> ${formData.salesInfo.fastestSelling}</p>
                            <p><strong>💰 Produits les plus rentables:</strong> ${formData.salesInfo.highestProfit}</p>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>🌍 Pays de vente:</strong> ${formData.customers.countries}</p>
                            <p><strong>🏪 Type de vente:</strong> ${formData.customers.salesType}</p>
                        </div>
                        
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50;">
                            <p style="margin: 0; color: #2e7d32;">
                                <strong>✅ Le PDF complet est en pièce jointe.</strong>
                            </p>
                        </div>
                        
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800;">
                            <p style="margin: 0; color: #e65100;">
                                <strong>🕐 Soumis le:</strong> ${new Date(formData.timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Ce message a été généré automatiquement par le système FOFANA Confiserie.</p>
                        <p>© ${new Date().getFullYear()} FOFANA CONFISERIE - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        attachments: [
            {
                filename: `FOFANA_${formData.companyInfo.companyName}_${formData.id}.pdf`,
                path: pdfPath,
                contentType: 'application/pdf'
            }
        ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return info;
}

// Function to generate PDF
async function generatePDF(formData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const pdfPath = path.join(__dirname, 'pdfs', `submission_${formData.id}.pdf`);
            const writeStream = fs.createWriteStream(pdfPath);

            doc.pipe(writeStream);

            // Header
            doc.fontSize(20)
                .text('FOFANA CONFISERIE', { align: 'center' })
                .fontSize(16)
                .text('Formulaire d\'Informations Commerciales', { align: 'center' })
                .moveDown();

            doc.fontSize(12)
                .text(`Date de soumission: ${new Date(formData.timestamp).toLocaleDateString('fr-FR')}`)
                .moveDown();

            // Company Information
            doc.fontSize(14).text('1. INFORMATIONS SUR L\'ENTREPRISE', { underline: true })
                .fontSize(12)
                .text(`Nom officiel: ${formData.companyInfo.companyName}`)
                .text(`Année de création: ${formData.companyInfo.establishYear}`)
                .text(`Adresse: ${formData.companyInfo.companyAddress}`)
                .text(`Emplacement des entrepôts: ${formData.companyInfo.warehouseLocations}`)
                .moveDown();

            // Suppliers
            doc.fontSize(14).text('2. INFORMATIONS SUR LES FOURNISSEURS', { underline: true })
                .fontSize(12);
            formData.suppliers.forEach((supplier, index) => {
                doc.text(`Fournisseur ${index + 1}:`)
                    .text(`  - Entreprise: ${supplier.companyName}`)
                    .text(`  - Pays: ${supplier.country}`)
                    .text(`  - Ville: ${supplier.city}`)
                    .text(`  - Contact: ${supplier.contact}`)
                    .text(`  - Produits: ${supplier.products}`)
                    .moveDown(0.5);
            });
            doc.moveDown();

            // Import Information
            doc.fontSize(14).text('3. INFORMATIONS SUR LES IMPORTATIONS', { underline: true })
                .fontSize(12)
                .text(`Produits importés: ${formData.importInfo.products}`)
                .text(`Quantité moyenne: ${formData.importInfo.quantity}`)
                .text(`Fréquence: ${formData.importInfo.frequency}`)
                .text(`Durée de transport: ${formData.importInfo.shippingTime}`)
                .text(`Moyen de transport: ${formData.importInfo.shippingMethod}`)
                .moveDown();

            // Sales Information
            doc.fontSize(14).text('4. INFORMATIONS SUR LES VENTES', { underline: true })
                .fontSize(12)
                .text(`Produits les plus vendus: ${formData.salesInfo.fastestSelling}`)
                .text(`Produits les moins vendus: ${formData.salesInfo.slowestSelling}`)
                .text(`Produits les plus rentables: ${formData.salesInfo.highestProfit}`)
                .text(`Produits qui expirent: ${formData.salesInfo.expireProducts}`)
                .moveDown();

            // Customers
            doc.fontSize(14).text('5. CLIENTS', { underline: true })
                .fontSize(12)
                .text(`Pays de vente: ${formData.customers.countries}`)
                .text(`Plus grands clients: ${formData.customers.biggestCustomers}`)
                .text(`Type de vente: ${formData.customers.salesType}`)
                .moveDown();

            // Warehouses
            doc.fontSize(14).text('6. ENTREPÔTS', { underline: true })
                .fontSize(12)
                .text(`Nombre d'entrepôts: ${formData.warehouses.count}`)
                .text(`Capacité de stockage: ${formData.warehouses.capacity}`)
                .text(`Produits par entrepôt: ${formData.warehouses.products}`)
                .moveDown();

            // Business Challenges
            doc.fontSize(14).text('7. DÉFIS DE L\'ENTREPRISE', { underline: true })
                .fontSize(12)
                .text(`Principaux problèmes: ${formData.challenges.mainProblems}`)
                .text(`Tâches chronophages: ${formData.challenges.timeConsumingTasks}`)
                .text(`Décisions difficiles: ${formData.challenges.difficultDecisions}`)
                .text(`Attentes IA: ${formData.challenges.aiExpectations}`)
                .moveDown();

            // Footer
            doc.fontSize(10)
                .text('Document généré automatiquement par FOFANA Confiserie System', { align: 'center' });

            doc.end();

            writeStream.on('finish', () => resolve(pdfPath));
            writeStream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}

// Route to get all submissions
app.get('/get-submissions', (req, res) => {
    try {
        const dataFile = path.join(__dirname, 'data', 'submissions.json');
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const data = JSON.parse(fileContent);
            res.json(data);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json([]);
    }
});

// Route to download PDF
app.get('/download-pdf/:id', (req, res) => {
    const id = req.params.id;
    const pdfPath = path.join(__dirname, 'pdfs', `submission_${id}.pdf`);

    if (fs.existsSync(pdfPath)) {
        res.download(pdfPath);
    } else {
        res.status(404).json({ error: 'PDF not found' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`📝 Form: http://localhost:${PORT}/form.html`);
    console.log('\n📧 Email configuration:');
    console.log(`   User: ${EMAIL_USER}`);
    console.log(`   To: ${EMAIL_TO}`);
});