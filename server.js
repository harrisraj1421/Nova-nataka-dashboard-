require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const EXCEL_FILE = 'nova_nataka_registrations.xlsx';

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("CRITICAL: MONGODB_URI is missing in .env! Data will not persist correctly.");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log("Connected to MongoDB Atlas ✅"))
        .catch(err => console.error("MongoDB Connection Error ❌:", err));
}

// --- Schema Definition ---
const registrationSchema = new mongoose.Schema({
    teamId: String,
    teamName: String,
    memberCount: Number,
    registrationDate: { type: Date, default: Date.now },
    lastUpdated: Date,
    m1_name: String, m1_email: { type: String, lowercase: true }, m1_phone: String, m1_college: String, m1_dept: String, m1_year: String,
    m2_name: String, m2_phone: String, m2_college: String, m2_dept: String, m2_year: String,
    m3_name: String, m3_phone: String, m3_college: String, m3_dept: String, m3_year: String
});

const Registration = mongoose.model('Registration', registrationSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Helper: Get Writable Path ---
function getExcelPath() {
    const defaultPath = path.join(__dirname, EXCEL_FILE);

    // Check if we are in a serverless environment (like Vercel/AWS)
    // These environments usually only allow writing to /tmp
    if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.NOW_REGION) {
        const os = require('os');
        return path.join(os.tmpdir(), EXCEL_FILE);
    }

    return defaultPath;
}

// --- Helper: Save to MongoDB ---
async function saveToDB(data) {
    const leadEmail = data.m1_email.trim().toLowerCase();

    // Calculate total members
    let memberCount = 1;
    if (data.m2_name && data.m2_name.trim() !== "") memberCount++;
    if (data.m3_name && data.m3_name.trim() !== "") memberCount++;

    const updateData = {
        teamName: data.teamName,
        memberCount: memberCount,
        m1_name: data.m1_name,
        m1_email: leadEmail,
        m1_phone: data.m1_phone,
        m1_college: data.m1_college,
        m1_dept: data.m1_dept,
        m1_year: data.m1_year,
        m2_name: data.m2_name || 'N/A',
        m2_phone: data.m2_phone || 'N/A',
        m2_college: data.m2_college || 'N/A',
        m2_dept: data.m2_dept || 'N/A',
        m2_year: data.m2_year || 'N/A',
        m3_name: data.m3_name || 'N/A',
        m3_phone: data.m3_phone || 'N/A',
        m3_college: data.m3_college || 'N/A',
        m3_dept: data.m3_dept || 'N/A',
        m3_year: data.m3_year || 'N/A',
        lastUpdated: new Date()
    };

    let existing = await Registration.findOne({ m1_email: leadEmail });

    if (existing) {
        console.log(`[DB] Updating existing record for: ${leadEmail}`);
        await Registration.updateOne({ m1_email: leadEmail }, { $set: updateData });
        return true; // isUpdate
    } else {
        console.log(`[DB] Adding new record for: ${leadEmail}`);
        const count = await Registration.countDocuments();
        const newReg = new Registration({
            ...updateData,
            teamId: `Team ${count + 1}`,
            registrationDate: new Date()
        });
        await newReg.save();
        return false; // isUpdate
    }
}

// --- Helper: Send Email ---
async function sendConfirmationEmail(userEmail, userName, isUpdate = false) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const subject = isUpdate ? 'Nova Nataka Registration Updated ✅' : 'Nova Nataka Registration Successful ✅';
    const title = isUpdate ? 'Registration Updated! 🔄' : 'Welcome to Nova Nataka! 🌟';
    const statusText = isUpdate ? 'Your registration details have been <strong>successfully updated</strong>.' : 'Your registration for <strong>Nova Nataka</strong> has been successfully completed.';

    const mailOptions = {
        from: `"Nova Nataka Team" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        replyTo: process.env.EMAIL_USER,
        subject: subject,
        priority: 'high',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #bc13fe; text-align: center;">${title}</h2>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>${statusText}</p>
                <p>Get ready to shine on stage among the stars! We are excited to see what your team brings to the event.</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Event:</strong> Nova Nataka</p>
                    <p style="margin: 0;"><strong>Status:</strong> ${isUpdate ? 'Updated ✅' : 'Registered ✅'}</p>
                </div>

                <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #cce5ff; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #004085;"><strong>Join our Official WhatsApp Group:</strong></p>
                    <a href="https://chat.whatsapp.com/H7ZE2l6tHQsFMRtS38dpfc?mode=gi_t" style="background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Join WhatsApp Group</a>
                </div>

                <p>See you at the event!</p>
                <p style="font-size: 0.9em; color: #777;">Best Regards,<br>Nova Nataka Organizing Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // We don't throw here to ensure registration is saved even if email fails
    }
}

// --- API Endpoints ---
app.get('/api/ping', (req, res) => {
    res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

// Admin: Get all registrations
app.get('/api/registrations', async (req, res) => {
    try {
        const data = await Registration.find().sort({ registrationDate: 1 });
        // Map to Excel-like format for the frontend dashboard
        const mappedData = data.map(reg => ({
            'Team ID': reg.teamId,
            'Team Name': reg.teamName,
            'Total Members': reg.memberCount,
            'Lead Name (M1)': reg.m1_name,
            'Lead Email (M1)': reg.m1_email,
            'Lead College (M1)': reg.m1_college,
            'Registration Date': reg.registrationDate.toLocaleString(),
            'Last Updated': reg.lastUpdated ? reg.lastUpdated.toLocaleString() : 'Never'
        }));
        res.status(200).json(mappedData);
    } catch (error) {
        console.error('Fetch all error:', error);
        res.status(500).json({ message: 'Error retrieving registrations' });
    }
});

app.get('/api/registration/:email', async (req, res) => {
    const email = req.params.email.trim().toLowerCase();
    try {
        const record = await Registration.findOne({ m1_email: email });

        if (record) {
            // Map MongoDB fields back to form names
            const formData = {
                teamName: record.teamName,
                m1_name: record.m1_name,
                m1_email: record.m1_email,
                m1_phone: record.m1_phone,
                m1_college: record.m1_college,
                m1_dept: record.m1_dept,
                m1_year: record.m1_year,
                m2_name: record.m2_name === 'N/A' ? '' : record.m2_name,
                m2_phone: record.m2_phone === 'N/A' ? '' : record.m2_phone,
                m2_college: record.m2_college === 'N/A' ? '' : record.m2_college,
                m2_dept: record.m2_dept === 'N/A' ? '' : record.m2_dept,
                m2_year: record.m2_year === 'N/A' ? '' : record.m2_year,
                m3_name: record.m3_name === 'N/A' ? '' : record.m3_name,
                m3_phone: record.m3_phone === 'N/A' ? '' : record.m3_phone,
                m3_college: record.m3_college === 'N/A' ? '' : record.m3_college,
                m3_dept: record.m3_dept === 'N/A' ? '' : record.m3_dept,
                m3_year: record.m3_year === 'N/A' ? '' : record.m3_year
            };
            res.status(200).json(formData);
        } else {
            res.status(404).json({ message: 'Registration not found with this email.' });
        }
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ message: 'Error retrieving data' });
    }
});

app.get('/admin/download', async (req, res) => {
    try {
        const data = await Registration.find().sort({ registrationDate: 1 });
        const excelData = data.map(reg => ({
            'Team ID': reg.teamId,
            'Registration Date': reg.registrationDate.toLocaleString(),
            'Team Name': reg.teamName,
            'Total Members': reg.memberCount,
            'Lead Name (M1)': reg.m1_name,
            'Lead Email (M1)': reg.m1_email,
            'Lead Phone (M1)': reg.m1_phone,
            'Lead College (M1)': reg.m1_college,
            'Lead Dept (M1)': reg.m1_dept,
            'Lead Year (M1)': reg.m1_year,
            'Member 2 Name': reg.m2_name,
            'Member 2 Phone': reg.m2_phone,
            'Member 2 College': reg.m2_college,
            'Member 2 Dept': reg.m2_dept,
            'Member 2 Year': reg.m2_year,
            'Member 3 Name': reg.m3_name,
            'Member 3 Phone': reg.m3_phone,
            'Member 3 College': reg.m3_college,
            'Member 3 Dept': reg.m3_dept,
            'Member 3 Year': reg.m3_year,
            'Last Updated': reg.lastUpdated ? reg.lastUpdated.toLocaleString() : 'Never'
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

        // Write to buffer to send directly
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=Nova_Nataka_Registrations.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send("Error generating Excel file.");
    }
});

app.post('/api/delete-registration', async (req, res) => {
    const { email, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized. Invalid admin password.' });
    }

    try {
        const result = await Registration.deleteOne({ m1_email: email.trim().toLowerCase() });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        console.log(`[DELETE] Removed record for: ${email}`);
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting record' });
    }
});

app.post('/api/register', async (req, res) => {
    console.log("\n[REQUEST] " + new Date().toLocaleTimeString() + " - New registration attempt");
    console.log("Data:", JSON.stringify(req.body, null, 2));

    try {
        // Trim all string values to handle mobile autocomplete spaces
        const registrationData = {};
        for (const [key, value] of Object.entries(req.body)) {
            registrationData[key] = typeof value === 'string' ? value.trim() : value;
        }

        // 1. Validation (Backend)
        if (!registrationData.m1_email || !registrationData.teamName) {
            console.warn("Validation failed: Missing email or team name.");
            return res.status(400).json({ message: 'Missing required fields' });
        }

        console.log(`[API] Processing registration for: ${registrationData.m1_email}`);
        console.log(`[DEVICE] User-Agent: ${req.headers['user-agent']}`);

        // 2. Save to database
        const isUpdate = await saveToDB(registrationData);

        // 3. Send Email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("CRITICAL: Email environment variables (EMAIL_USER/EMAIL_PASS) are missing!");
        } else {
            console.log(`[MAIL] Attempting to send ${isUpdate ? 'update' : 'new'} confirmation...`);
            await sendConfirmationEmail(registrationData.m1_email, registrationData.m1_name, isUpdate);
        }

        console.log(">>> REGISTRATION COMPLETED SUCCESSFULLY <<<\n");
        res.status(200).json({
            message: isUpdate ? 'Registration updated' : 'Registration successful',
            debug: { emailSent: true, isUpdate }
        });
    } catch (error) {
        console.error('>>> REGISTRATION FAILED ERROR:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            message: error.message || 'Internal Server Error',
            error: true
        });
    }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
