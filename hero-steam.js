const heroSteam = document.querySelector('.hero-steam');
const heroImage = document.querySelector('.hero-photo');

function alignHeroSteam() {
    if (!heroImage.naturalWidth) return;
    const width = heroImage.clientWidth;
    const height = heroImage.clientHeight;
    const scale = Math.max(width / heroImage.naturalWidth, height / heroImage.naturalHeight);
    const [x, y] = getComputedStyle(heroImage).objectPosition.split(' ').map(parseFloat);
    // Point on the coffee surface in the original 1536 × 1024 photograph.
    const left = (width - heroImage.naturalWidth * scale) * x / 100 + 1319 * scale;
    const top = (height - heroImage.naturalHeight * scale) * y / 100 + 672 * scale;
    heroSteam.style.setProperty('--steam-x', left + 'px');
    heroSteam.style.setProperty('--steam-y', top + 'px');
    heroSteam.style.setProperty('--steam-size', 92 * scale + 'px');
}

heroImage.addEventListener('load', alignHeroSteam);
new ResizeObserver(alignHeroSteam).observe(heroImage);
alignHeroSteam();
