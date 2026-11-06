export const presets = {
  jihlava: [49.396, 15.591], prague: [50.075, 14.438], london: [51.507, -0.128],
  newyork: [40.713, -74.006], sydney: [-33.869, 151.209],
};

const rad = Math.PI / 180;
export const wrap = angle => ((angle % 360) + 360) % 360;

export function sidereal(date, longitude) {
  const days = date.getTime() / 86400000 + 2440587.5 - 2451545;
  const centuries = days / 36525;
  return wrap(280.46061837 + 360.98564736629 * days + 0.000387933 * centuries ** 2 - centuries ** 3 / 38710000 + longitude);
}

export function horizontal(raHours, decDegrees, latitude, localSidereal) {
  const h = wrap(localSidereal - raHours * 15) * rad;
  const d = decDegrees * rad;
  const p = latitude * rad;
  const up = Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(h);
  const east = -Math.cos(d) * Math.sin(h);
  const north = Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.cos(h) * Math.sin(p);
  return {alt: Math.asin(Math.max(-1, Math.min(1, up))) / rad, az: wrap(Math.atan2(east, north) / rad)};
}

export function chartPoint(alt, az, cx, cy, radius) {
  const distance = radius * (90 - alt) / 90;
  return {x: cx - distance * Math.sin(az * rad), y: cy - distance * Math.cos(az * rad)};
}

export const catalog = [
  ['M31','Andromeda Galaxy','Galaxy','Andromeda',.712,41.269,3.4,'A broad spiral galaxy. Begin with its bright central glow, then look for its elongated outline under a dark sky.'],
  ['M42','Orion Nebula','Nebula','Orion',5.588,-5.391,4.0,'A stellar nursery in Orion’s Sword. In a telescope, look for the tight group of stars at the centre known as the Trapezium.'],
  ['M45','Pleiades','Cluster','Taurus',3.790,24.117,1.6,'A compact group of bright blue stars. Its wide shape is especially rewarding in binoculars.'],
  ['M13','Hercules Cluster','Cluster','Hercules',16.695,36.461,5.8,'A globular cluster tucked along the western side of the Keystone of Hercules.'],
  ['M57','Ring Nebula','Nebula','Lyra',18.893,33.029,8.8,'An expanding shell left by a dying star. Look for a small ring between the stars Beta and Gamma Lyrae.'],
  ['M27','Dumbbell Nebula','Nebula','Vulpecula',19.993,22.721,7.5,'A planetary nebula with two bright lobes that give it its familiar shape.'],
  ['M44','Beehive Cluster','Cluster','Cancer',8.667,19.667,3.7,'A loose group of stars in Cancer. Its spread makes it a good target for binoculars.'],
  ['M81','Bode’s Galaxy','Galaxy','Ursa Major',9.926,69.066,6.9,'A spiral galaxy in Ursa Major. Nearby M82 offers a contrasting shape in the same part of the sky.'],
  ['SIR','Sirius','Star','Canis Major',6.752,-16.716,-1.46,'The brightest star in Earth’s night sky. Follow Orion’s Belt southeast to find it.'],
  ['VEG','Vega','Star','Lyra',18.615,38.784,.03,'A bright blue-white star and one corner of the Summer Triangle.'],
  ['ALT','Altair','Star','Aquila',19.846,8.868,.77,'A bright star in Aquila and the southern point of the Summer Triangle.'],
  ['DEN','Deneb','Star','Cygnus',20.691,45.280,1.25,'The bright tail of Cygnus and the third corner of the Summer Triangle.'],
  ['POL','Polaris','Star','Ursa Minor',2.530,89.264,1.98,'The current North Star, close to the north celestial pole. Its altitude roughly matches northern latitude.'],
  ['BET','Betelgeuse','Star','Orion',5.919,7.407,.5,'A red supergiant at Orion’s shoulder. Its brightness varies over time.'],
  ['RIG','Rigel','Star','Orion',5.242,-8.202,.13,'A blue-white supergiant marking one of Orion’s feet.'],
  ['ANT','Antares','Star','Scorpius',16.490,-26.432,1.1,'A reddish star near the heart of Scorpius. Its colour stands out against neighbouring stars.'],
].map(([id,name,type,constellation,ra,dec,mag,description]) => ({id,name,type,constellation,ra,dec,mag,description}));

export function csvFor(items, date) {
  const quote = value => '"' + String(value).replaceAll('"', '""') + '"';
  const lines = items.map(({id,name,type,alt,az}) => [id,name,type,alt.toFixed(1),az.toFixed(1),date.toISOString()].map(quote).join(','));
  return ['ID,Name,Type,Altitude (deg),Azimuth (deg),UTC', ...lines].join('\r\n') + '\r\n';
}
