mapboxgl.accessToken = 'pk.eyJ1IjoibGlva2FuZyIsImEiOiJja25nZmhtdmgyb3RjMnl0YXRtbGIyNTR3In0.bct1DftOoKQkfxrepOrg6g';

navigator.geolocation.getCurrentPosition(sucessLocation,
  errorLocation,{
    enableHighAccuracy:true
  })

  function sucessLocation(position){
    console.log("hello");
  setupMap([position.coords.longitude , position.coords.latitude])
}

function errorLocation(error){
  console.log("hello");
  console.log(error);
}

function setupMap(center){
  const map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: center,
      zoom: 15 // starting zoom

  })
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav);


var directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  // unit: 'metric',
  // profile: 'mapbox/cycling'
});


map.addControl(directions, 'top-left');
}
