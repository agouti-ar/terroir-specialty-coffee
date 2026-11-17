const mapRegion = document.getElementById('atelier-map');
const mapObserver = new IntersectionObserver(async entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    mapObserver.disconnect();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'assets/leaflet/leaflet.css';
    document.head.append(css);
    const script = document.createElement('script');
    script.src = 'assets/leaflet/leaflet.js';
    script.onload = () => {
        const point = [40.41810, -3.70345];
        const map = L.map(mapRegion, { scrollWheelZoom: false }).setView(point, 16);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);
        const icon = L.divIcon({
            className: 'signature-map-icon',
            html: '<span class="signature-pin" aria-hidden="true">T</span>',
            iconSize: [42, 48],
            iconAnchor: [3, 48],
            popupAnchor: [18, -44]
        });
        L.marker(point, { icon, title: 'Terroir Coffee Atelier — Concept Location, Madrid', alt: 'Terroir Concept Location', keyboard: true })
            .addTo(map)
            .bindPopup('<strong>Terroir Coffee Atelier</strong><br>Concept Location, Madrid');
        new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(mapRegion);
    };
    script.onerror = () => { mapRegion.textContent = document.querySelector('[data-i18n="map_open"]').textContent; };
    document.head.append(script);
}, { rootMargin: '250px' });
mapObserver.observe(mapRegion);
