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
});

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

