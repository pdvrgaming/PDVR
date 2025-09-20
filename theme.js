// Theme Toggle Function
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
    }
});