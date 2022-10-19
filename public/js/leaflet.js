/* eslint-disable */
//! CODE FOR LEAFLET MAP ->
export const displayMap = locations => {
  //@ Create the map and attach it to the #map div -
  const map = L.map('map', { zoomControl: false });

  //@ Add a tile layer to add to the map -THEME
  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);

  //@ Create marker icon -
  var greenIcon = L.icon({
    iconUrl: '/img/pin.png',
    iconSize: [32, 40], // size of the icon
    iconAnchor: [16, 40], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -50], // point from which the popup should open relative to the iconAnchor
  });

  //@ Add locations to the map -
  const points = [];
  locations.forEach(loc => {
    //~ Create points -
    points.push([loc.coordinates[1], loc.coordinates[0]]);

    //~ Load all markers and popups as soon as map gets loaded -
    // map.addEventListener('load', function () {
    map.on('load', () => {
      //~ Add markers
      L.marker([loc.coordinates[1], loc.coordinates[0]], {
        icon: greenIcon,
      })
        .addTo(map)
        //~ Add popup
        .bindPopup(
          `<h2 style="color:#777"> <span style="color:#55c57a"> Day ${loc.day} :</span> ${loc.description}</h2>`,
          {
            className: 'mapPopup',
            autoClose: false,
            offset: L.point(0, 35),
            closeOnClick: false,
          }
        )
        .openPopup();
    });
    //OR
    // L.popup([loc.coordinates[1], loc.coordinates[0]], {
    //   content: `<h2>Day ${loc.day}: ${loc.description}</h2>`,
    //   className: 'mapPopup',
    //   autoClose: false,
    //   closeOnClick: false,
    //   offset: L.point(0, -12),
    // }).openOn(map);
  });

  //@ Set map bounds to include current location
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  //@ Disable scroll on map
  map.scrollWheelZoom.disable();
};

//! CODE FOR MAPBOX ->
// export const displayMap = locations => {
//   mapboxgl.accessToken =
//     'pk.eyJ1IjoidmNkYXMxMjMiLCJhIjoiY2w4bDhvcDg0MDU2MzN2c3JyeHV1am9jNCJ9.8kraAkX91BnvK4-iIOi2BA';

//   var map = new mapboxgl.Map({
//     container: 'map',
//     style: 'mapbox://styles/vcdas123/cl8l9kzqq000b14mv0elefi32',
//     scrollZoom: false,
//     //   interactive:false
//     //   center: [-118.113491, 34.111745],
//     //   zoom: 9,
//   });

//   const bounds = new mapboxgl.LngLatBounds();

//   locations.forEach(loc => {
//     // Create marker
//     const el = document.createElement('div');
//     el.className = 'marker';

//     // Add Marker
//     new mapboxgl.Marker({
//       element: el,
//       anchor: 'bottom',
//     })
//       .setLngLat(loc.coordinates)
//       .addTo(map);

//     // Add popup
//     new mapboxgl.Popup({
//       offset: 30,
//     })
//       .setLngLat(loc.coordinates)
//       .setHTML(`<p>Day ${loc.day}: ${loc.description}`)
//       .addTo(map);

//     // Extend map bounds to include current location
//     bounds.extend(loc.coordinates);
//   });

//   map.fitBounds(bounds, {
//     padding: {
//       top: 250,
//       bottom: 150,
//       left: 100,
//       right: 100,
//     },
//   });
// };

// ----------------------------------------------
// Function to display map on tour page
// ----------------------------------------------
