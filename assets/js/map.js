let corner1 = L.latLng(15.002745460437396,107.89156597253896),
    corner2 = L.latLng(10.339808116484065,102.20114177417332),
    bounds = L.latLngBounds(corner1, corner2);

let map = L.map('fim-map', {
  maxBounds: bounds,
  maxBoundsViscosity: 0.2,
  gestureHandling: true,
  // gestureHandlingOptions: {
  //   text: {
  //     touch: "Hey bro, use two fingers to move the map",
  //     scroll: "Hey bro, use ctrl + scroll to zoom the map",
  //     scrollMac: "Hey bro, use \u2318 + scroll to zoom the map"
  //   }
  // }
}).setView([12.5657, 104.9910], 8);

const osmMapnikUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmMapnikAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const osmMapnik = L.tileLayer(osmMapnikUrl, {
  maxZoom: 19,
  attribution: osmMapnikAttrib
})

let basemaps = {
  'Open Street Map Mapnik': osmMapnik,
}

L.control.resetView({
  position: "topleft",
  title: "Reset view",
  latlng: L.latLng([12.5657, 104.9910]),
  zoom: 7,
}).addTo(map);

// L.control.layers(basemaps).addTo(map);

map.addLayer(osmMapnik);

// let stadiaAlidadeSmoothMini = L.tileLayer(osmMapnikUrl, {
//   maxZoom: 20,
//   attribution: osmMapnikAttrib
// })

// let miniMap = new L.Control.MiniMap(stadiaAlidadeSmoothMini, {
//   toggleDisplay: true,
//   collapsedWidth: 20,
//   collapsedHeight: 20
// }).addTo(map);
