export type MapListing = {
  id: number;
  title: string;
  category: string;
  price: string;
  priceType: string;
  area: string;
  seller: string;
  latOffset: number;
  lngOffset: number;
};

export type MapCoords = {
  latitude: number;
  longitude: number;
};

export const MOCK_MAP_LISTINGS: MapListing[] = [
  { id: 1, title: 'Gel Nails & Nail Art', category: 'Nails', price: '35', priceType: 'set', area: 'South Campus', seller: 'Aisha K.', latOffset: 0.0012, lngOffset: -0.0008 },
  { id: 2, title: 'Portrait Photography', category: 'Photography', price: '60', priceType: 'hour', area: 'Main Quad', seller: 'Marcus T.', latOffset: -0.0005, lngOffset: 0.0015 },
  { id: 3, title: 'Professional Headshots', category: 'Headshots', price: '45', priceType: 'set', area: 'Library', seller: 'Jordan L.', latOffset: 0.0003, lngOffset: -0.0012 },
  { id: 4, title: 'Box Braids & Knotless Braids', category: 'Hair Braiding', price: '80', priceType: 'set', area: 'Dorm Area', seller: 'Fatima O.', latOffset: -0.0018, lngOffset: 0.0006 },
  { id: 5, title: 'Full Glam Makeup', category: 'Makeup', price: '50', priceType: 'set', area: 'North Campus', seller: 'Zoe M.', latOffset: 0.0020, lngOffset: 0.0003 },
  { id: 6, title: 'Calculus & Stats Tutoring', category: 'Tutoring', price: '25', priceType: 'hour', area: 'Science Building', seller: 'David P.', latOffset: -0.0007, lngOffset: -0.0018 },
  { id: 7, title: 'Logo & Brand Design', category: 'Graphic Design', price: '40', priceType: 'hour', area: 'Remote', seller: 'Priya S.', latOffset: 0.0015, lngOffset: 0.0010 },
  { id: 8, title: 'Room Deep Clean', category: 'Cleaning', price: '20', priceType: 'hour', area: 'All Dorms', seller: 'Sam G.', latOffset: 0.0018, lngOffset: -0.0003 },
  { id: 9, title: 'Custom Beat Production', category: 'Music Production', price: '75', priceType: 'track', area: 'Remote', seller: 'Elijah R.', latOffset: 0.0008, lngOffset: -0.0005 },
  { id: 10, title: 'Personal Training', category: 'Personal Training', price: '30', priceType: 'hour', area: 'Campus Gym', seller: 'Maya J.', latOffset: 0.0006, lngOffset: 0.0018 },
];

export function buildMapHtml(apiKey: string, coords: MapCoords, listings: MapListing[], universityName: string): string {
  const markers = listings.map((l) => ({
    lat: coords.latitude + l.latOffset,
    lng: coords.longitude + l.lngOffset,
    title: l.title,
    category: l.category,
    price: `$${l.price}/${l.priceType}`,
    seller: l.seller,
    area: l.area,
  }));

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
      html, body { height: 100%; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
      gmp-map { height: 100%; }
      .search-box { padding: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      gmpx-place-picker { width: 100%; }
      .info-card {
        background: white;
        border-radius: 12px;
        padding: 12px 16px;
        margin: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        font-size: 14px;
      }
      .info-card .name { font-weight: 700; font-size: 15px; color: #0d0d0d; }
      .info-card .meta { color: #607d8b; margin-top: 2px; }
      .info-card .badge {
        display: inline-block;
        background: #e8f4fd;
        color: #1976d2;
        border-radius: 20px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 6px;
      }
      .info-card .price { float: right; font-weight: 700; color: #0d47a1; font-size: 15px; }
    </style>
  </head>
  <body>
    <gmpx-api-loader key="${apiKey}" solution-channel="GMP_GE_mapsandplacesautocomplete_v2"></gmpx-api-loader>
    <gmp-map center="${coords.latitude},${coords.longitude}" zoom="15" map-id="DEMO_MAP_ID">
      <div slot="control-block-start-inline-start" class="search-box">
        <gmpx-place-picker placeholder="Search campus or area..."></gmpx-place-picker>
      </div>
    </gmp-map>

    <script type="module" src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"></script>

    <script>
      const LISTINGS = ${JSON.stringify(markers)};

      const AREA_COLORS = {
        'South Campus':    '#E91E63',
        'Main Quad':       '#3F51B5',
        'Library':         '#009688',
        'Dorm Area':       '#FF9800',
        'North Campus':    '#9C27B0',
        'Science Building':'#F44336',
        'Remote':          '#607D8B',
        'All Dorms':       '#FF5722',
        'Campus Gym':      '#4CAF50',
        'Tech Center':     '#00BCD4',
        'West Campus':     '#8BC34A',
        'East Hall':       '#FFC107',
        'Campus-wide':     '#795548',
      };

      function colorForArea(area) {
        return AREA_COLORS[area] || '#4FC3F7';
      }

      async function init() {
        await customElements.whenDefined('gmp-map');
        const mapEl = document.querySelector('gmp-map');
        const placePicker = document.querySelector('gmpx-place-picker');
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
        const infoWindow = new google.maps.InfoWindow();
        const innerMap = mapEl.innerMap;

        innerMap.setOptions({ mapTypeControl: false });

        LISTINGS.forEach((listing) => {
          const color = colorForArea(listing.area);
          const pin = new google.maps.marker.PinElement({
            background: color,
            borderColor: '#ffffff',
            glyphColor: '#000000',
            glyph: '$' + listing.price.split('/')[0].replace('$', ''),
            scale: 1.1,
          });

          const marker = new AdvancedMarkerElement({
            map: innerMap,
            position: { lat: listing.lat, lng: listing.lng },
            title: listing.title,
            content: pin.element,
          });

          marker.addListener('click', () => {
            const color = colorForArea(listing.area);
            infoWindow.setContent(
              '<div class="info-card">' +
              '<span class="price">' + listing.price + '</span>' +
              '<div class="name">' + listing.title + '</div>' +
              '<div class="meta">' +
              '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';margin-right:5px;vertical-align:middle;"></span>' +
              'by ' + listing.seller + ' &middot; ' + listing.area +
              '</div>' +
              '<span class="badge">' + listing.category + '</span>' +
              '</div>'
            );
            infoWindow.open(innerMap, marker);
          });
        });

        placePicker.addEventListener('gmpx-placechange', () => {
          const place = placePicker.value;
          if (!place.location) return;
          if (place.viewport) {
            innerMap.fitBounds(place.viewport);
          } else {
            mapEl.center = place.location;
            mapEl.zoom = 16;
          }
        });
      }

      document.addEventListener('DOMContentLoaded', init);
    </script>
  </body>
</html>`;
}
