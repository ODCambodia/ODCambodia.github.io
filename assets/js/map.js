let map = L.map('fim-map', {
  gestureHandling: true,
  // gestureHandlingOptions: {
  //   text: {
  //     touch: "Hey bro, use two fingers to move the map",
  //     scroll: "Hey bro, use ctrl + scroll to zoom the map",
  //     scrollMac: "Hey bro, use \u2318 + scroll to zoom the map"
  //   }
  // }
}).setView([12.5657, 104.9910], 7);

const osmMapnikUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmMapnikAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const osmMapnik = L.tileLayer(osmMapnikUrl, {
  maxZoom: 19,
  attribution: osmMapnikAttrib
})

let basemaps = {
  'Open Street Map Mapnik': osmMapnik,
}

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
