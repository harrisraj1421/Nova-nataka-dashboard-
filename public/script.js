window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        // Optional: Remove from DOM after transition
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = document.getElementById('loader');
    const successModal = document.getElementById('successModal');

    // --- Load Existing Details Logic ---
    const loadBtn = document.getElementById('loadBtn');
    const searchEmailInput = document.getElementById('searchEmail');

    loadBtn.addEventListener('click', async () => {
        const email = searchEmailInput.value.trim();
        if (!email) {
            alert('Please enter an email to search.');
            return;
        }

        // Port check for Load button too
        if (window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            alert('⚠️ Connection Error!\nYou are on port ' + window.location.port + '.\nPlease use http://localhost:3000 for the Load feature to work.');
            return;
        }

        loadBtn.disabled = true;
        loadBtn.textContent = 'Loading...';

        try {
            const response = await fetch(`/api/registration/${encodeURIComponent(email)}`);

            // Check content type before parsing as JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON response received:", text);
                throw new Error("Server returned an invalid response (HTML). Please ensure the server is running on port 3000.");
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration not found.');
            }

            // Populate Form Fields
            Object.keys(result).forEach(key => {
                const field = registrationForm.elements[key];
                if (field) {
                    field.value = result[key];
                }
            });

            alert('Details loaded successfully! You can now edit and re-register.');

            // Highlight the form for the user
            registrationForm.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error loading details:', error);
            alert(error.message);
        } finally {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Load Details';
        }
    });

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Basic Validation (HTML5 pattern covers phone/email, but let's double check)
        const formData = new FormData(registrationForm);
        const data = Object.fromEntries(formData.entries());

        console.log("Submitting form with data:", data);

        // Show Loading
        submitBtn.disabled = true;
        btnText.style.opacity = '0';
        loader.style.display = 'block';

        try {
            // Check if user is using the wrong port (e.g. Live Server on 5500)
            if (window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (window.location.port !== '3000') {
                    console.warn('⚠️ You are likely using VS Code Live Server (Port ' + window.location.port + '). Please use http://localhost:3000 for registration to work.');
                }
            }

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log("Server response:", result);

            if (!response.ok) {
                throw new Error(result.message || 'Server error');
            }

            // Show Success
            showModal();
            registrationForm.reset();
            searchEmailInput.value = ''; // Clear search box too

            // Live Update: Refresh the dashboard data
            if (typeof fetchRegistrations === 'function') {
                fetchRegistrations();
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            if (window.location.port !== '3000') {
                alert('❌ Connection Failed!\nYou are currently on port ' + window.location.port + '.\nPlease open http://localhost:3000 in your browser to submit the form.');
            } else {
                alert('An error occurred: ' + error.message);
            }
        } finally {
            // Hide Loading
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            loader.style.display = 'none';
        }
    });
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // --- Interstellar Easter Eggs ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function nextSlide() {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        // Skip the secret-gargantua slide unless explicitly triggered
        if (slides[currentSlide].id === 'secret-gargantua' && !document.body.classList.contains('tesseract-mode')) {
            currentSlide = (currentSlide + 1) % slides.length;
        }
        slides[currentSlide].classList.add('active');
    }

    // 1. Time Dilation: Click the Cosmic Orb to slow down the universe
    const orb = document.querySelector('.cosmic-orb');
    let isTimeStretched = false;
    let slideshowInterval;

    // Assuming it's defined elsewhere or will be added.
    const startSlideshow = (duration) => {
        if (slideshowInterval) clearInterval(slideshowInterval);
        slideshowInterval = setInterval(nextSlide, duration);
    };

    if (orb) {
        orb.addEventListener('click', () => {
            isTimeStretched = !isTimeStretched;
            const duration = isTimeStretched ? 15000 : 3000;
            startSlideshow(duration);

            orb.style.animationDuration = isTimeStretched ? '12s' : '4s';
            orb.style.boxShadow = isTimeStretched ? '0 0 100px #bc13fe' : 'none';

            const msg = isTimeStretched ? "Time dilation active... 1 hour here is 7 years on Earth." : "Time normalized.";
            console.log(`%c ${msg} `, 'background: #000; color: #00d2ff; font-size: 14px; font-weight: bold;');

            // Visual feedback
            const feedback = document.createElement('div');
            feedback.innerText = isTimeStretched ? "⏳ TIME STRETCHED" : "⌛ TIME NORMALIZED";
            feedback.style.cssText = "position: fixed; top: 120px; right: 20px; background: rgba(0,0,0,0.8); color: cyan; padding: 10px 20px; border-radius: 5px; border: 1px solid cyan; z-index: 2000; font-family: monospace; pointer-events: none; animation: fadeOut 3s forwards;";
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
        });
    }

    // 2. Secret "STAY" Message
    let keyBuffer = "";
    document.addEventListener('keydown', (e) => {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.substring(1);

        if (keyBuffer.endsWith("stay")) {
            triggerStayEgg();
            keyBuffer = "";
        }
        if (keyBuffer.endsWith("murph")) {
            document.body.style.filter = "sepia(0.8) contrast(1.2)";
            console.log("Don't let me leave, Murph!");
            setTimeout(() => document.body.style.filter = "none", 5000);
        }
    });

    function triggerStayEgg() {
        const title = document.querySelector('.animate-title span');
        const originalText = title.innerText;
        title.innerHTML = "S T A Y . . .";
        title.style.color = "red";
        title.style.textShadow = "0 0 20px red";

        const audio = new Audio('https://www.soundjay.com/communication/radio-static-01.mp3');
        audio.volume = 0.2;
        audio.play();

        setTimeout(() => {
            title.innerText = "Nova Nataka.";
            title.style.color = "";
            title.style.textShadow = "";
            audio.pause();
        }, 4000);
    }

    // 3. Tesseract Mode (Triple click on the logo)
    let logoClicks = 0;
    const navLogo = document.querySelector('.nav-event-logo');
    navLogo.addEventListener('click', () => {
        logoClicks++;
        if (logoClicks === 3) {
            document.body.classList.toggle('tesseract-mode');
            alert(document.body.classList.contains('tesseract-mode') ? "Entering the Tesseract..." : "Leaving the Tesseract...");
            logoClicks = 0;
        }
        setTimeout(() => logoClicks = 0, 1000);
    });

    // 4. Endurance Docking Spin (Long Hover on nav logo)
    let spinTimer;
    navLogo.addEventListener('mouseenter', () => {
        spinTimer = setTimeout(() => {
            navLogo.classList.add('docking-spin');
            console.log("%c [PROTOCOL] Docking sequence initiated. ", 'color: #0f0; font-weight: bold;');
        }, 2000);
    });
    navLogo.addEventListener('mouseleave', () => {
        clearTimeout(spinTimer);
        navLogo.classList.remove('docking-spin');
    });

    // 5. Konami Code (Supernova Start)
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerSupernova();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function triggerSupernova() {
        const flare = document.createElement('div');
        flare.className = 'supernova-flare';
        document.body.appendChild(flare);

        console.log("%c [DANGER] SUPERNOVA DETECTED. ", 'background: red; color: white; padding: 10px; font-weight: bold;');

        setTimeout(() => flare.remove(), 2000);
    }

    // 6. Stellar Parallax (Orb responds to mouse)
    document.addEventListener('mousemove', (e) => {
        if (!orb) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        orb.style.transform = `translate(${x}px, ${y}px)`;

        if (isTimeStretched) {
            const hue = (e.clientX / window.innerWidth) * 360;
            orb.style.filter = `blur(40px) hue-rotate(${hue}deg)`;
        }
    });

    // Initialize slideshow with default duration
    startSlideshow(3000);

    // Initial fetch if we're on the dashboard
    if (window.location.hash === '#admin') {
        fetchRegistrations();
    }

    // Auto-refresh the dashboard every 30 seconds for "live" feel
    setInterval(() => {
        if (document.getElementById('admin') && document.getElementById('admin').getBoundingClientRect().top < window.innerHeight) {
            fetchRegistrations();
        }
    }, 30000);

    console.log("%c [LOG] Nova Nataka Terminal Online. All systems green. ", 'color: cyan;');
    console.log("%c [QUERY] Have you tried the TARS protocols? (Check the logo) ", 'color: #888; font-style: italic;');

    // Hidden Admin trigger (Triple click on Footer copyright)
    const footerCredits = document.querySelector('.credits');
    if (footerCredits) {
        footerCredits.addEventListener('dblclick', () => {
            toggleAdminMode();
        });
    }
});

let adminPassword = null;

function toggleAdminMode() {
    if (document.body.classList.contains('admin-mode')) {
        document.body.classList.remove('admin-mode');
        adminPassword = null;
        alert('Admin mode disabled.');
        return;
    }

    const pw = prompt('Enter Admin Password to enable modifications:');
    if (pw === null) return;

    if (pw === 'admin123') { // Simple local check for showing buttons, server will verify properly
        document.body.classList.add('admin-mode');
        adminPassword = pw;
        alert('Admin mode activated. Delete buttons are now visible.');
    } else {
        alert('Invalid password.');
    }
}

async function fetchRegistrations() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.innerText = 'Refreshing...';
    try {
        const response = await fetch('/api/registrations');
        const data = await response.json();

        const body = document.getElementById('regBody');
        if (!body) return;
        body.innerHTML = '';

        let totalParticipants = 0;

        data.forEach(reg => {
            totalParticipants += parseInt(reg['Total Members'] || 1);
            const isUpdated = (reg['Last Updated'] && reg['Last Updated'] !== 'Never');

            const row = `
                <tr>
                    <td><strong>${reg['Team ID']}</strong></td>
                    <td>${reg['Team Name']}</td>
                    <td>${reg['Lead Name (M1)']}</td>
                    <td>${reg['Lead Email (M1)']}</td>
                    <td>${reg['Lead College (M1)']}</td>
                    <td>
                        <div class="action-cell">
                             <span class="status-badge ${isUpdated ? 'status-updated' : 'status-new'}">
                                ${isUpdated ? 'Edited' : 'New'}
                            </span>
                            <button class="btn-delete" onclick="deleteRegistration('${reg['Lead Email (M1)']}')">Delete</button>
                        </div>
                    </td>
                    <td>${(!reg['Last Updated'] || reg['Last Updated'] === 'Never') ? reg['Registration Date'] : reg['Last Updated']}</td>
                </tr>
            `;
            body.innerHTML += row;
        });

        document.getElementById('totalTeams').innerText = data.length;
        document.getElementById('totalParticipants').innerText = totalParticipants;

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (btn) btn.innerText = 'Refresh Data';
    }
}

async function deleteRegistration(email) {
    if (!adminPassword) {
        alert('You must enable Admin Mode to delete registrations.');
        return;
    }

    if (!confirm(`Are you sure you want to delete the registration for ${email}?`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password: adminPassword })
        });

        // Robust JSON parsing
        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error("Non-JSON error response:", text);
            throw new Error(`Server Error (${response.status}): The server did not return a valid response. Please try again.`);
        }

        if (response.ok) {
            alert('Registration deleted successfully.');
            fetchRegistrations(); // Refresh the list
        } else {
            alert('Error: ' + (result.message || 'Unknown error occurred.'));
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert(err.message || 'Could not delete registration. Check console for details.');
    }
}

function showModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Scroll Reveal Logic for Storytelling
const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
};

const revealObserver = new IntersectionObserver(revealCallback, {
    threshold: 0.1
});

document.querySelectorAll('.hero-content, .card, .story-text-container, .registration-container, .admin-section').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

