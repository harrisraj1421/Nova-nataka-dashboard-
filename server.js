require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const EXCEL_FILE = 'nova_nataka_registrations.xlsx';

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

// --- Helper: Save to Excel (UPSERT Logic) ---
function saveToExcel(data) {
    const filePath = getExcelPath();
    let workbook;
    let existingData = [];

    // Clean inputs for matching
    const leadEmail = data.m1_email.trim().toLowerCase();

    // Calculate total members
    let memberCount = 1;
    if (data.m2_name && data.m2_name.trim() !== "") memberCount++;
    if (data.m3_name && data.m3_name.trim() !== "") memberCount++;

    const entryData = {
        'Team Name': data.teamName,
        'Total Members': memberCount,
        'Lead Name (M1)': data.m1_name,
        'Lead Email (M1)': data.m1_email, // Keep original for display
        'Lead Phone (M1)': data.m1_phone,
        'Lead College (M1)': data.m1_college,
        'Lead Dept (M1)': data.m1_dept,
        'Lead Year (M1)': data.m1_year,
        'Member 2 Name': data.m2_name || 'N/A',
        'Member 2 Phone': data.m2_phone || 'N/A',
        'Member 2 College': data.m2_college || 'N/A',
        'Member 2 Dept': data.m2_dept || 'N/A',
        'Member 2 Year': data.m2_year || 'N/A',
        'Member 3 Name': data.m3_name || 'N/A',
        'Member 3 Phone': data.m3_phone || 'N/A',
        'Member 3 College': data.m3_college || 'N/A',
        'Member 3 Dept': data.m3_dept || 'N/A',
        'Member 3 Year': data.m3_year || 'N/A'
    };

    let isUpdate = false;
    try {
        if (fs.existsSync(filePath)) {
            console.log("Reading existing Excel file...");
            workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            existingData = XLSX.utils.sheet_to_json(worksheet);

            // Case-insensitive check for existing user (by lead email)
            const existingIndex = existingData.findIndex(row =>
                row['Lead Email (M1)'] && row['Lead Email (M1)'].toString().trim().toLowerCase() === leadEmail
            );

            if (existingIndex !== -1) {
                console.log(`[EDIT] Updating existing record for: ${leadEmail}`);
                isUpdate = true;
                const originalRegDate = existingData[existingIndex]['Registration Date'] || new Date().toLocaleString();
                const teamId = existingData[existingIndex]['Team ID']; // Preserve original Team ID

                existingData[existingIndex] = {
                    'Team ID': teamId,
                    'Registration Date': originalRegDate,
                    ...entryData,
                    'Last Updated': new Date().toLocaleString()
                };
            } else {
                console.log(`[NEW] Adding new record for: ${leadEmail}`);
                isUpdate = false;
                // Calculate next Team ID
                const nextNum = existingData.length + 1;
                existingData.push({
                    'Team ID': `Team ${nextNum}`,
                    'Registration Date': new Date().toLocaleString(),
                    ...entryData,
                    'Last Updated': 'Never'
                });
            }
        } else {
            console.log("Creating new master Excel file...");
            workbook = XLSX.utils.book_new();
            isUpdate = false;
            existingData = [{
                'Team ID': 'Team 1',
                'Registration Date': new Date().toLocaleString(),
                ...entryData,
                'Last Updated': 'Never'
            }];
        }

        // Keep it organized by Team ID number
        existingData.sort((a, b) => {
            const numA = parseInt(a['Team ID'].replace('Team ', ''));
            const numB = parseInt(b['Team ID'].replace('Team ', ''));
            return numA - numB;
        });

        const newWorksheet = XLSX.utils.json_to_sheet(existingData);

        if (workbook.SheetNames.length === 0) {
            XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Registrations');
        } else {
            workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
        }

        XLSX.writeFile(workbook, filePath);
        console.log("Excel file successfully updated.");
        return isUpdate;
    } catch (excelError) {
        if (excelError.code === 'EBUSY' || excelError.toString().includes('permission denied')) {
            throw new Error("SERVER ERROR: The registration file is currently open in Excel. Please close it so the server can save your changes.");
        }
        console.error("Excel Helper Error:", excelError.message);
        throw excelError;
    }
}

// --- Helper: Send Email ---
async function sendConfirmationEmail(userEmail, userName, isUpdate = false) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
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
        subject: subject,
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
app.get('/api/registrations', (req, res) => {
    const filePath = getExcelPath();
    if (!fs.existsSync(filePath)) {
        return res.status(200).json([]); // Return empty array if no file yet
    }
    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch all error:', error);
        res.status(500).json({ message: 'Error retrieving registrations' });
    }
});

app.get('/api/registration/:email', (req, res) => {
    const email = req.params.email.trim().toLowerCase();
    const filePath = getExcelPath();

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'No registration found.' });
    }

    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Case-insensitive fetch
        const record = data.find(row =>
            row['Lead Email (M1)'] && row['Lead Email (M1)'].toString().trim().toLowerCase() === email
        );

        if (record) {
            // Map Excel headers back to form field names
            const formData = {
                teamName: record['Team Name'],
                m1_name: record['Lead Name (M1)'],
                m1_email: record['Lead Email (M1)'],
                m1_phone: record['Lead Phone (M1)'],
                m1_college: record['Lead College (M1)'],
                m1_dept: record['Lead Dept (M1)'],
                m1_year: record['Lead Year (M1)'],
                m2_name: record['Member 2 Name'] === 'N/A' ? '' : record['Member 2 Name'],
                m2_phone: record['Member 2 Phone'] === 'N/A' ? '' : record['Member 2 Phone'],
                m2_college: record['Member 2 College'] === 'N/A' ? '' : record['Member 2 College'],
                m2_dept: record['Member 2 Dept'] === 'N/A' ? '' : record['Member 2 Dept'],
                m2_year: record['Member 2 Year'] === 'N/A' ? '' : record['Member 2 Year'],
                m3_name: record['Member 3 Name'] === 'N/A' ? '' : record['Member 3 Name'],
                m3_phone: record['Member 3 Phone'] === 'N/A' ? '' : record['Member 3 Phone'],
                m3_college: record['Member 3 College'] === 'N/A' ? '' : record['Member 3 College'],
                m3_dept: record['Member 3 Dept'] === 'N/A' ? '' : record['Member 3 Dept'],
                m3_year: record['Member 3 Year'] === 'N/A' ? '' : record['Member 3 Year']
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

app.get('/admin/download', (req, res) => {
    const filePath = getExcelPath();

    if (fs.existsSync(filePath)) {
        // Prevent browser from caching old versions of the download
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.download(filePath, 'Nova_Nataka_Registrations.xlsx', (err) => {
            if (err) {
                console.error("Download error:", err);
                if (!res.headersSent) {
                    res.status(500).send("Could not download the file.");
                }
            }
        });
    } else {
        res.status(404).send("Registration file not found yet. No one has registered!");
    }
});

app.post('/api/delete-registration', (req, res) => {
    const { email, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Unauthorized. Invalid admin password.' });
    }

    if (!email) {
        return res.status(400).json({ message: 'Email is required to delete a record.' });
    }

    const filePath = getExcelPath();
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'No file found to delete from.' });
    }

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let data = XLSX.utils.sheet_to_json(worksheet);

        const initialLength = data.length;
        // Filter out the record with the matching email
        const filteredData = data.filter(row =>
            row['Lead Email (M1)'] && row['Lead Email (M1)'].toString().trim().toLowerCase() !== email.trim().toLowerCase()
        );

        if (filteredData.length === initialLength) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        // Re-calculate Team IDs for consistency (optional, but keeps it clean)
        const updatedData = filteredData.map((row, index) => {
            return {
                ...row,
                'Team ID': `Team ${index + 1}`
            };
        });

        const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, filePath);

        console.log(`[DELETE] Removed record for: ${email}`);
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        if (error.code === 'EBUSY' || error.toString().includes('permission denied')) {
            return res.status(500).json({ message: "SERVER ERROR: File is open in Excel. Close it to delete." });
        }
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting record' });
    }
});

app.post('/api/register', async (req, res) => {
    console.log("\n[REQUEST] " + new Date().toLocaleTimeString() + " - New registration attempt");
    console.log("Data:", JSON.stringify(req.body, null, 2));

    try {
        const registrationData = req.body;

        // 1. Validation (Backend)
        if (!registrationData.m1_email || !registrationData.teamName) {
            console.warn("Validation failed: Missing email or team name.");
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 2. Save to Excel
        const isUpdate = saveToExcel(registrationData);

        // 3. Send Email
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("CRITICAL: Email environment variables (EMAIL_USER/EMAIL_PASS) are missing!");
        } else {
            console.log("Attempting to send confirmation email...");
            await sendConfirmationEmail(registrationData.m1_email, registrationData.m1_name, isUpdate);
        }

        console.log(">>> REGISTRATION COMPLETED SUCCESSFULLY <<<\n");
        res.status(200).json({ message: isUpdate ? 'Registration updated' : 'Registration successful' });
    } catch (error) {
        console.error('>>> REGISTRATION FAILED ERROR:', error.message);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
