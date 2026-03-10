// Sticky navigation
window.addEventListener('scroll', function() {
    const nav = document.getElementById('mainNav');
    if (window.scrollY > 0) {
        nav.classList.add('sticky');
    } else {
        nav.classList.remove('sticky');
    }
});