// ===== LANGUAGE SYSTEM =====
let currentLang = localStorage.getItem('lang') || 'ru';
let translations = {};

// Load translations
async function loadTranslations() {
    try {
        const response = await fetch(`i18n/${currentLang}.json`);
        translations = await response.json();
        updatePageLanguage();
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

// Update all elements with data-i18n attribute
function updatePageLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });

    // Update html lang attribute
    document.documentElement.lang = currentLang;
}

// Language switcher buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        currentLang = lang;
        localStorage.setItem('lang', lang);

        // Update active button
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('lang-btn--active'));
        this.classList.add('lang-btn--active');

        // Reload translations
        loadTranslations();
    });
});

// Set initial active button
document.querySelector(`[data-lang="${currentLang}"]`)?.classList.add('lang-btn--active');

// Load translations on page load
loadTranslations();

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

console.log('MaDE website loaded with multi-language support!');
