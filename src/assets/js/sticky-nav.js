// Sticky navigation
const nav = document.getElementById('mainNav');
const contentWrap = document.getElementById('mainWrap');

window.addEventListener('scroll', function() {
    if (window.scrollY > 0) {
        nav.classList.add('sticky');
        contentWrap.style.paddingTop = nav.offsetHeight + 'px';
    } else {
        nav.classList.remove('sticky');
        contentWrap.style.paddingTop = '';
    }
});