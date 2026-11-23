// Correct fixes of the practice files (used only by the end-to-end test).
export const CSV_FIXED = `id,address,postcode,sale_date,price_gbp,bedrooms,source
P01,12 Example Road,AB1 2CD,2026-03-14,325000,3,land_registry
P02,Flat 4 Sample Court,AB1 3EF,2026-04-02,198000,1,land_registry
P03,7 Demo Close,AB2 4GH,2026-02-27,410000,4,land_registry
P04,3 Test Lane,AB2 5XY,2026-05-09,287500,2,land_registry
P05,21 Mock Avenue,AB3 5JK,2026-02-28,352000,3,land_registry
P06,9 Pilot Street,AB3 6LM,2026-06-14,240000,2,land_registry
P07,15 Trial Gardens,AB4 7NP,2026-06-20,300000,3,land_registry
P08,2 Draft Mews,AB4 8QR,2026-07-01,615000,2,land_registry
P09,30 Proof Road,AB5 9ST,2026-07-18,299950,3,land_registry
P10,5 Check Way,AB5 1UV,2026-08-03,455000,4,land_registry
`;

const feat = (id: string, name: string, geometry: unknown) => ({ type: 'Feature', id, properties: { name }, geometry });
export const GEO_FIXED = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    feat('library', 'Town library', { type: 'Point', coordinates: [-0.1654, 51.4012] }),
    feat('school', 'Primary school', { type: 'Point', coordinates: [-0.1702, 51.4031] }),
    feat('clinic', 'Health clinic', { type: 'Point', coordinates: [-0.1588, 51.3986] }),
    feat('station', 'Railway station', { type: 'Point', coordinates: [-0.1597, 51.3994] }),
    feat('bus-route', 'Bus route 1', { type: 'LineString', coordinates: [[-0.1654, 51.4012], [-0.1597, 51.3994]] }),
    feat('park', 'Green park', { type: 'Polygon', coordinates: [[[-0.172, 51.405], [-0.168, 51.405], [-0.168, 51.402], [-0.172, 51.402], [-0.172, 51.405]]] }),
    feat('market', 'Market square', { type: 'Point', coordinates: [-0.1611, 51.4002] }),
  ],
}, null, 2);

export const HTML_FIXED = `<!doctype html>
<html lang="en">
<head><title>Corner Bakery — order</title></head>
<body>
  <h1>Corner Bakery</h1>
  <img src="bread.jpg" alt="Loaves of fresh bread on a shelf">
  <p style="color:#595959; background-color:#ffffff">Fresh bread every morning.</p>
  <form>
    <label for="name">Name</label>
    <input type="text" id="name">
    <label for="email">Email</label>
    <input type="email" id="email">
    <button type="submit">Send order</button>
  </form>
  <a href="/offers">Offers</a>
  <a href="https://example.org/map" target="_blank" rel="noopener noreferrer">Find us</a>
  <h2>Opening hours</h2>
</body>
</html>`;
