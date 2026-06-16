window.addEventListener('load', () => {
    document.body.classList.add('page-loaded');
});

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', e => {

        const href = link.getAttribute('href');

        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('http')
        ) return;

        e.preventDefault();

        document.body.classList.add('page-exit');

        setTimeout(() => {
            window.location.href = href;
        }, 300);
    });
});