window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const loader = document.getElementById('loader');
    const successModal = document.getElementById('successModal');
    const searchEmailInput = document.getElementById('searchEmail');
    const loadBtn = document.getElementById('loadBtn');

    // --- Load Existing Details ---
    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            const email = searchEmailInput.value.trim();
            if (!email) {
                alert('Please enter an email to search.');
                return;
            }

            if (window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                alert('⚠️ Connection Error!\nPlease use http://localhost:3000 for the Load feature.');
                return;
            }

            loadBtn.disabled = true;
            loadBtn.textContent = 'Loading...';

            try {
                const response = await fetch(`/api/registration/${encodeURIComponent(email)}`);
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server returned an invalid response. Use port 3000.");
                }

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Registration not found.');

                Object.keys(result).forEach(key => {
                    const field = registrationForm.elements[key];
                    if (field) field.value = result[key];
                });

                alert('Details loaded successfully! You can now edit and re-register.');
                registrationForm.scrollIntoView({ behavior: 'smooth' });

            } catch (error) {
                console.error('Error loading details:', error);
                alert(error.message);
            } finally {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load Details';
            }
        });
    }

    // --- Registration Form Submit ---
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registrationForm);
            const data = Object.fromEntries(formData.entries());

            submitBtn.disabled = true;
            if (btnText) btnText.style.opacity = '0';
            if (loader) loader.style.display = 'block';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Server error');

                showModal();
                registrationForm.reset();
                if (searchEmailInput) searchEmailInput.value = '';
                if (typeof fetchRegistrations === 'function') fetchRegistrations();

            } catch (error) {
                console.error('Submission error:', error);
                alert('An error occurred: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                if (btnText) btnText.style.opacity = '1';
                if (loader) loader.style.display = 'none';
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside the header
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.college-header')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // --- Dynamic Mini-Navbar Feedback (Optional) ---
    const eventMiniNav = document.querySelector('.event-navbar-mini');

    function updateHeaderOnScroll() {
        if (!eventMiniNav) return;
        const scrolled = window.scrollY > 50;

        if (scrolled) {
            eventMiniNav.style.padding = '0.3rem 1rem';
            eventMiniNav.style.background = 'rgba(255, 255, 255, 0.08)';
        } else {
            eventMiniNav.style.padding = '0.5rem 1.2rem';
            eventMiniNav.style.background = 'rgba(255, 255, 255, 0.03)';
        }
    }

    window.addEventListener('scroll', updateHeaderOnScroll);
    updateHeaderOnScroll();

    // --- Interstellar Easter Eggs ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function nextSlide() {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        if (slides[currentSlide].id === 'secret-gargantua' && !document.body.classList.contains('tesseract-mode')) {
            currentSlide = (currentSlide + 1) % slides.length;
        }
        slides[currentSlide].classList.add('active');
    }

    const orb = document.querySelector('.cosmic-orb');
    let isTimeStretched = false;
    let slideshowInterval;

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

            const feedback = document.createElement('div');
            feedback.innerText = isTimeStretched ? "⏳ TIME STRETCHED" : "⌛ TIME NORMALIZED";
            feedback.style.cssText = "position: fixed; top: 120px; right: 20px; background: rgba(0,0,0,0.8); color: cyan; padding: 10px 20px; border-radius: 5px; border: 1px solid cyan; z-index: 2000; font-family: monospace; pointer-events: none; animation: fadeOut 3s forwards;";
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
        });
    }

    // "STAY" Mystery
    let keyBuffer = "";
    document.addEventListener('keydown', (e) => {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.substring(1);
        if (keyBuffer.endsWith("stay")) triggerStayEgg();
        if (keyBuffer.endsWith("murph")) {
            document.body.style.filter = "sepia(0.8) contrast(1.2)";
            setTimeout(() => document.body.style.filter = "none", 5000);
        }
    });

    function triggerStayEgg() {
        const titleSpan = document.querySelector('.animate-title span');
        if (titleSpan) {
            const originalText = titleSpan.innerText;
            titleSpan.innerHTML = "S T A Y . . .";
            titleSpan.style.color = "red";
            setTimeout(() => {
                titleSpan.innerText = originalText;
                titleSpan.style.color = "";
            }, 4000);
        }
    }

    // Tesseract Mode
    const navLogo = document.querySelector('.nav-event-logo-mini');
    let logoClicks = 0;
    if (navLogo) {
        navLogo.addEventListener('click', () => {
            logoClicks++;
            if (logoClicks === 3) {
                document.body.classList.toggle('tesseract-mode');
                logoClicks = 0;
            }
            setTimeout(() => logoClicks = 0, 1000);
        });

        // Docking Spin
        let spinTimer;
        navLogo.addEventListener('mouseenter', () => {
            spinTimer = setTimeout(() => navLogo.classList.add('docking-spin'), 2000);
        });
        navLogo.addEventListener('mouseleave', () => {
            clearTimeout(spinTimer);
            navLogo.classList.remove('docking-spin');
        });
    }

    // Konami Code
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
        setTimeout(() => flare.remove(), 2000);
    }

    document.addEventListener('mousemove', (e) => {
        if (!orb) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Hidden Admin trigger
    const footerCredits = document.querySelector('.credits');
    if (footerCredits) {
        footerCredits.addEventListener('dblclick', () => toggleAdminMode());
    }

    // Start everything
    startSlideshow(3000);
    if (window.location.hash === '#admin') fetchRegistrations();
    setInterval(() => {
        if (document.getElementById('admin')) fetchRegistrations();
    }, 30000);
});

// --- Global Functions ---
let adminPassword = null;

function toggleAdminMode() {
    if (document.body.classList.contains('admin-mode')) {
        document.body.classList.remove('admin-mode');
        adminPassword = null;
        alert('Admin mode disabled.');
        return;
    }
    const pw = prompt('Enter Admin Password:');
    if (pw === 'admin123') {
        document.body.classList.add('admin-mode');
        adminPassword = pw;
        alert('Admin mode activated.');
    } else if (pw !== null) {
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
                            <span class="status-badge ${isUpdated ? 'status-updated' : 'status-new'}">${isUpdated ? 'Edited' : 'New'}</span>
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
        console.error('Fetch error:', err);
    } finally {
        if (btn) btn.innerText = 'Refresh Data';
    }
}

async function deleteRegistration(email) {
    if (!adminPassword) { alert('Enable Admin Mode first.'); return; }
    if (!confirm(`Delete registration for ${email}?`)) return;
    try {
        const response = await fetch('/api/delete-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: adminPassword })
        });
        const result = await response.json();
        if (response.ok) {
            alert('Deleted successfully.');
            fetchRegistrations();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error('Delete error:', err);
    }
}

function showModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll Reveal Logic
const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
};
const revealObserver = new IntersectionObserver(revealCallback, { threshold: 0.1 });
document.querySelectorAll('.hero-content, .card, .story-text-container, .registration-container, .admin-section').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});
