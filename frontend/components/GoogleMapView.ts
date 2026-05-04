export type MapCoords = { latitude: number; longitude: number };

export type MapListing = {
  id: number;
  title: string;
  category: string;
  price: string;
  priceType: string;
  area: string;
  seller: string;
  latitude: number;
  longitude: number;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function buildMapHtml(
  apiKey: string,
  campusCoords: MapCoords,
  listings: MapListing[],
  selectedListingId = ''
): string {
  const safeListings = JSON.stringify(listings).replace(/</g, '\\u003c');
  const safeSelectedId = escapeHtml(selectedListingId);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width" />
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, sans-serif;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: #eaf4fb;
    }

    #app, #map-shell, #map, #fallback-map {
      height: 100%;
      width: 100%;
    }

    #map-shell {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(79, 195, 247, 0.2), transparent 34%),
        linear-gradient(180deg, #eff7fd 0%, #e1eff8 100%);
    }

    #map {
      position: absolute;
      inset: 0;
      filter: saturate(0.72) brightness(0.98);
    }

    #map.faded {
      opacity: 0.16;
      pointer-events: none;
    }

    #overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .hud-row {
      position: absolute;
      left: 14px;
      right: 14px;
      top: 14px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .badge,
    .count-chip,
    .fallback-banner {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 999px;
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
      color: #0f172a;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .badge-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #4fc3f7;
      box-shadow: 0 0 0 5px rgba(79, 195, 247, 0.18);
    }

    .count-chip {
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .selection-card {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 14px;
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 22px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
      padding: 16px 16px 14px;
      display: none;
      max-width: 340px;
    }

    .selection-card.visible {
      display: block;
    }

    .selection-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #38bdf8;
      margin-bottom: 8px;
    }

    .selection-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 5px;
    }

    .selection-meta,
    .selection-seller,
    .selection-area {
      font-size: 13px;
      color: #475569;
      line-height: 1.45;
    }

    .selection-price {
      font-size: 14px;
      font-weight: 800;
      color: #2563eb;
      margin: 8px 0 6px;
    }

    .selection-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 999px;
      background: #e2e8f0;
      color: #334155;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .selection-close:hover {
      background: #cbd5e1;
    }

    #fallback-map {
      position: absolute;
      inset: 0;
      display: none;
      background:
        linear-gradient(rgba(255,255,255,0.42) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.42) 1px, transparent 1px),
        radial-gradient(circle at top, rgba(79, 195, 247, 0.2), transparent 40%),
        linear-gradient(180deg, #dff1fb 0%, #d6eaf8 100%);
      background-size: 32px 32px, 32px 32px, auto, auto;
    }

    #fallback-map.visible {
      display: block;
    }

    .fallback-banner {
      position: absolute;
      left: 14px;
      right: 14px;
      top: 70px;
      border-radius: 18px;
      padding: 12px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      line-height: 1.5;
      max-width: 420px;
    }

    .board-label {
      position: absolute;
      transform: translate(-50%, -50%);
      pointer-events: none;
      text-align: center;
    }

    .board-campus {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #0f172a;
      border: 5px solid rgba(255,255,255,0.85);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.2);
      margin: 0 auto 8px;
    }

    .board-campus-text {
      display: inline-block;
      background: rgba(15, 23, 42, 0.92);
      color: #ffffff;
      padding: 7px 11px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .service-pin {
      position: absolute;
      transform: translate(-50%, -100%);
      pointer-events: auto;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
    }

    .service-dot {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #ef4444;
      border: 4px solid rgba(255, 255, 255, 0.92);
      box-shadow: 0 16px 28px rgba(239, 68, 68, 0.3);
      transition: transform 0.18s ease, background 0.18s ease;
    }

    .service-pin.selected .service-dot {
      background: #2563eb;
      transform: scale(1.18);
      box-shadow: 0 20px 32px rgba(37, 99, 235, 0.34);
    }

    .service-tag {
      margin-top: 8px;
      background: rgba(255, 255, 255, 0.96);
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 999px;
      box-shadow: 0 12px 22px rgba(15, 23, 42, 0.12);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="app">
    <div id="map-shell">
      <div id="map"></div>
      <div id="fallback-map"></div>
      <div id="overlay">
        <div class="hud-row">
          <div class="badge">
            <span class="badge-dot"></span>
            <span>Campus service map</span>
          </div>
          <div class="count-chip" id="count-chip"></div>
        </div>
        <div class="fallback-banner" id="fallback-banner" style="display:none;"></div>
        <div class="selection-card" id="selection-card"></div>
      </div>
    </div>
  </div>
  <script>
    const campus = ${JSON.stringify(campusCoords)};
    const listings = ${safeListings};
    const selectedId = "${safeSelectedId}";
    const mapElement = document.getElementById('map');
    const fallbackElement = document.getElementById('fallback-map');
    const fallbackBannerElement = document.getElementById('fallback-banner');
    const selectionElement = document.getElementById('selection-card');
    const countChipElement = document.getElementById('count-chip');
    let map = null;
    let campusMarker = null;
    let listingMarkers = [];
    let currentSelectedId = selectedId || '';
    let usingFallback = false;

    countChipElement.textContent = listings.length === 1
      ? '1 service'
      : listings.length + ' services';

    function notifySelection(listingId) {
      const payload = JSON.stringify({ type: 'listing-selected', listingId });
      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
        window.ReactNativeWebView.postMessage(payload);
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    }

    function escapeText(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function buildSelectionCard(listing) {
      return (
        '<button class="selection-close" type="button" aria-label="Close">×</button>' +
        '<div class="selection-label">Selected service</div>' +
        '<div class="selection-title">' + escapeText(listing.title) + '</div>' +
        '<div class="selection-meta">' + escapeText(listing.category) + '</div>' +
        '<div class="selection-price">$' + escapeText(listing.price) + '/' + escapeText(listing.priceType) + '</div>' +
        '<div class="selection-seller">' + escapeText(listing.seller) + '</div>' +
        '<div class="selection-area">' + escapeText(listing.area) + '</div>'
      );
    }

    function showSelection(listing) {
      if (!listing) {
        selectionElement.classList.remove('visible');
        selectionElement.innerHTML = '';
        return;
      }

      selectionElement.innerHTML = buildSelectionCard(listing);
      selectionElement.classList.add('visible');
      const closeButton = selectionElement.querySelector('.selection-close');
      if (closeButton) {
        closeButton.addEventListener('click', (event) => {
          event.preventDefault();
          clearSelection();
        });
      }
    }

    function clearSelection() {
      currentSelectedId = '';
      updateMarkerStyles();
      showSelection(null);
      notifySelection(null);
    }

    function selectListingById(listingId) {
      const nextId = listingId == null ? '' : String(listingId);
      currentSelectedId = nextId;
      const listing = listings.find((item) => String(item.id) === nextId) || null;
      updateMarkerStyles();
      showSelection(listing);
      if (listing) {
        if (map && !usingFallback) {
          map.panTo({ lat: listing.latitude, lng: listing.longitude });
          const currentZoom = map.getZoom();
          if (!currentZoom || currentZoom < 17) {
            map.setZoom(17);
          }
        }
        notifySelection(listing.id);
      }
    }

    function createMarkerIcon(isSelected) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isSelected ? '#2563eb' : '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: isSelected ? 4 : 3,
        scale: isSelected ? 10 : 8
      };
    }

    function updateMarkerStyles() {
      if (usingFallback) {
        Array.from(fallbackElement.querySelectorAll('.service-pin')).forEach((pin) => {
          pin.classList.toggle('selected', pin.dataset.listingId === currentSelectedId);
        });
        return;
      }

      listingMarkers.forEach(({ marker, listing }) => {
        marker.setIcon(createMarkerIcon(String(listing.id) === currentSelectedId));
        marker.setZIndex(String(listing.id) === currentSelectedId ? 3 : 1);
      });
    }

    function renderFallback(reason) {
      usingFallback = true;
      mapElement.classList.add('faded');
      fallbackElement.classList.add('visible');
      fallbackElement.innerHTML = '';
      fallbackBannerElement.style.display = 'block';
      fallbackBannerElement.textContent = reason;

      const points = [campus].concat(listings.map((listing) => ({
        latitude: listing.latitude,
        longitude: listing.longitude
      })));

      const latitudes = points.map((point) => point.latitude);
      const longitudes = points.map((point) => point.longitude);
      const minLat = Math.min.apply(null, latitudes);
      const maxLat = Math.max.apply(null, latitudes);
      const minLng = Math.min.apply(null, longitudes);
      const maxLng = Math.max.apply(null, longitudes);
      const latSpan = Math.max(maxLat - minLat, 0.0025);
      const lngSpan = Math.max(maxLng - minLng, 0.0025);

      function toPercent(value, min, span) {
        return 12 + ((value - min) / span) * 76;
      }

      const campusLabel = document.createElement('div');
      campusLabel.className = 'board-label';
      campusLabel.style.left = toPercent(campus.longitude, minLng, lngSpan) + '%';
      campusLabel.style.top = (100 - toPercent(campus.latitude, minLat, latSpan)) + '%';
      campusLabel.innerHTML =
        '<div class="board-campus"></div>' +
        '<div class="board-campus-text">University</div>';
      fallbackElement.appendChild(campusLabel);

      listings.forEach((listing) => {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'service-pin';
        pin.dataset.listingId = String(listing.id);
        pin.style.left = toPercent(listing.longitude, minLng, lngSpan) + '%';
        pin.style.top = (100 - toPercent(listing.latitude, minLat, latSpan)) + '%';
        pin.innerHTML =
          '<div class="service-dot"></div>' +
          '<div class="service-tag">' + escapeText(listing.title) + '</div>';
        pin.addEventListener('click', () => selectListingById(listing.id));
        fallbackElement.appendChild(pin);
      });

      updateMarkerStyles();
      if (currentSelectedId) {
        const selectedListing = listings.find((listing) => String(listing.id) === currentSelectedId) || null;
        showSelection(selectedListing);
      }
    }

    function initMap() {
      if (!window.google || !window.google.maps) {
        renderFallback('Map preview unavailable, so showing a simplified campus view instead.');
        return;
      }

      map = new google.maps.Map(mapElement, {
        center: { lat: campus.latitude, lng: campus.longitude },
        zoom: 15,
        disableDefaultUI: true,
        clickableIcons: false,
        keyboardShortcuts: false,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'water', stylers: [{ color: '#d9eefc' }] }
        ]
      });

      campusMarker = new google.maps.Marker({
        map,
        position: { lat: campus.latitude, lng: campus.longitude },
        title: 'University',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#0f172a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 4,
          scale: 9
        }
      });

      listingMarkers = listings.map((listing) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: listing.latitude, lng: listing.longitude },
          title: listing.title,
          icon: createMarkerIcon(String(listing.id) === currentSelectedId),
          zIndex: String(listing.id) === currentSelectedId ? 3 : 1
        });

        marker.addListener('click', () => {
          selectListingById(listing.id);
        });

        return { marker, listing };
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: campus.latitude, lng: campus.longitude });
      listings.forEach((listing) => bounds.extend({ lat: listing.latitude, lng: listing.longitude }));
      map.fitBounds(bounds, 72);

      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom && zoom > 16) {
          map.setZoom(16);
        }
      });

      map.addListener('click', () => {
        showSelection(null);
        currentSelectedId = '';
        updateMarkerStyles();
        notifySelection(null);
      });

      if (currentSelectedId) {
        const selectedListing = listings.find((listing) => String(listing.id) === currentSelectedId) || null;
        showSelection(selectedListing);
      }
    }

    window.gm_authFailure = function() {
      renderFallback('Google Maps could not load here, so we switched to a simplified campus service map.');
    };

    if (!"${escapeHtml(apiKey)}") {
      renderFallback('Google Maps is not configured yet, so showing a simplified campus service map.');
    } else {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=${escapeHtml(apiKey)}&callback=initMap';
      script.async = true;
      script.onerror = function() {
        renderFallback('Map preview unavailable, so showing a simplified campus service map instead.');
      };
      document.head.appendChild(script);

      window.setTimeout(() => {
        if (!map && !usingFallback) {
          renderFallback('Map preview timed out, so showing a simplified campus service map instead.');
        }
      }, 3500);
    }
  </script>
</body>
</html>`;
}
