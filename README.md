# Nova Nataka Event Registration Website 🚀

A complete, responsive event registration website with a Cosmic/Galaxy theme. Features automatic team registration saved to an Excel file and confirmation emails sent via Nodemailer.

## ✨ Features
- **Modern UI**: Cosmic theme with glassmorphism and stars animation.
- **Backend**: Node.js & Express server.
- **Excel Storage**: Automatic saving of registration details into `nova_nataka_registrations.xlsx`.
- **Email Automation**: Automatic confirmation emails sent to the Team Lead.
- **Responsive**: Fully optimized for mobile and desktop.

## 📁 Folder Structure
```text
Nova-nataka/
├── public/
│   ├── index.html    # Frontend structure
│   ├── style.css     # Theme & Animations
│   └── script.js    # Form logic & Scroll
├── server.js         # Backend logic (Excel, Mail, Express)
├── package.json      # Dependencies
├── .env              # Environment variables
└── .env.example      # Template for .env
```

## 🛠️ Instructions to Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- A Gmail account for sending emails.

### 2. Setup Gmail SMTP
To use Gmail for sending confirmation emails, you should NOT use your regular password.
1. Enable **2-Step Verification** on your Google account.
2. Go to [App Passwords](https://myaccount.google.com/apppasswords).
3. Select 'Mail' and 'Other' (name it 'NovaNataka').
4. Copy the **16-character generated password**.

### 3. Installation
Open your terminal in the project directory and run:
```bash
npm install
```

### 4. Configuration
1. Create a file named `.env` in the root directory.
2. Copy the content from `.env.example` into `.env`.
3. Replace the placeholder values:
   - `EMAIL_USER`: Your Gmail address.
   - `EMAIL_PASS`: The 16-character App Password you generated earlier.

### 5. Start the Server
Run the following command to start the website:
```bash
npm start
```
The website will be live at `http://localhost:3000`.

## 📝 Note
- All registrations will be saved in `nova_nataka_registrations.xlsx` automatically.
- Ensure the `public` folder contains `index.html`, `style.css`, and `script.js`.

---
Created for **Nova Nataka** - *Born among the stars.* 🌟
n