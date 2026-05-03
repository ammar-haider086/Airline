let airportIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/167/167707.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});
// ==========================
// 🌍 CITIES DATABASE
// ==========================
let cities = {
    Karachi: [24.8607, 67.0011],
    Lahore: [31.5204, 74.3587],
    Islamabad: [33.6844, 73.0479],
    Dubai: [25.2048, 55.2708],
    London: [51.5074, -0.1278],
    NewYork: [40.7128, -74.0060]
};

// ==========================
// 🗺 MAP
// ==========================
let map = L.map('map').setView([30, 20], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// ==========================
// ✈ PLANE ICON
// ==========================
let planeIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/201/201623.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

let plane;
let routeLine;

// ==========================
// 📍 LOAD DROPDOWN
// ==========================
let startSel = document.getElementById("start");
let endSel = document.getElementById("end");

function loadCities() {
    startSel.innerHTML = "";
    endSel.innerHTML = "";

    for (let c in cities) {
        startSel.innerHTML += `<option>${c}</option>`;
        endSel.innerHTML += `<option>${c}</option>`;
    }
}
loadCities();

// ==========================
// 📍 MARKERS
// ==========================
function drawAirports() {
    for (let c in cities) {
        L.marker(cities[c], { icon: airportIcon })
            .addTo(map)
            .bindPopup("✈ " + c);
    }
}
drawAirports();

// ==========================
// 📏 DISTANCE FORMULA
// ==========================
function distance(a, b) {
    let R = 6371;

    let dLat = (b[0] - a[0]) * Math.PI/180;
    let dLng = (b[1] - a[1]) * Math.PI/180;

    let x =
        Math.sin(dLat/2)**2 +
        Math.cos(a[0]*Math.PI/180) *
        Math.cos(b[0]*Math.PI/180) *
        Math.sin(dLng/2)**2;

    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

// ==========================
// 🧠 DIJKSTRA
// ==========================
function dijkstra(start, end) {
    let dist = {}, prev = {}, visited = {};

    for (let c in cities) {
        dist[c] = Infinity;
        visited[c] = false;
    }

    dist[start] = 0;

    for (let i = 0; i < Object.keys(cities).length; i++) {
        let u = null;

        for (let c in dist) {
            if (!visited[c] && (u === null || dist[c] < dist[u])) {
                u = c;
            }
        }

        if (!u) break;
        visited[u] = true;

        for (let v in cities) {
            if (v !== u) {
                let d = dist[u] + distance(cities[u], cities[v]);

                if (d < dist[v]) {
                    dist[v] = d;
                    prev[v] = u;
                }
            }
        }
    }

    let path = [];
    let cur = end;

    while (cur) {
        path.unshift(cur);
        cur = prev[cur];
    }

    return { path, distance: Math.round(dist[end]) };
}

// ==========================
// 💰 PRICE + TIME
// ==========================
function calc(distance) {
    return {
        price: Math.round(distance * 20 + 5000),
        time: (distance / 850).toFixed(2)
    };
}

// ==========================
// 🌈 CURVED ROUTE
// ==========================
function curve(a, b) {
    let points = [];

    for (let t = 0; t <= 1; t += 0.02) {
        let lat = a[0] + (b[0] - a[0]) * t;
        let lng = a[1] + (b[1] - a[1]) * t;

        lng += Math.sin(t * Math.PI) * 5;

        points.push([lat, lng]);
    }

    return points;
}

// ==========================
// 🛣 DRAW ROUTE
// ==========================
function drawRoute(path) {

    if (routeLine) map.removeLayer(routeLine);

    let all = [];

    for (let i = 0; i < path.length - 1; i++) {
        all = all.concat(curve(cities[path[i]], cities[path[i+1]]));
    }

    routeLine = L.polyline(all, {
        color: "#00aaff",
        weight: 4
    }).addTo(map);

    map.fitBounds(routeLine.getBounds());
}

// ==========================
// ✈ PLANE ANIMATION
// ==========================
async function animate(path) {

    if (plane) map.removeLayer(plane);

    plane = L.marker(cities[path[0]], { icon: planeIcon }).addTo(map);

    let fullPath = [];

    for (let i = 0; i < path.length - 1; i++) {
        fullPath = fullPath.concat(
            curve(cities[path[i]], cities[path[i+1]])
        );
    }

    for (let p of fullPath) {
        plane.setLatLng(p);
        await new Promise(r => setTimeout(r, 25));
    }
}

// ==========================
// 🔍 FIND ROUTE
// ==========================
function findRoute() {

    let start = startSel.value;
    let end = endSel.value;

    let res = dijkstra(start, end);
    let info = calc(res.distance);

    document.getElementById("result").innerText =
        `Route: ${res.path.join(" → ")}
Distance: ${res.distance} km
Price: Rs ${info.price}
Time: ${info.time} hrs`;

    drawRoute(res.path);
    animate(res.path);
}

// ==========================
// ➕ ADD CITY
// ==========================
function addCity() {

    let name = document.getElementById("city").value;
    let lat = parseFloat(document.getElementById("lat").value);
    let lng = parseFloat(document.getElementById("lng").value);

    cities[name] = [lat, lng];

   L.marker([lat, lng], { icon: airportIcon })
    .addTo(map)
    .bindPopup("✈ " + name);

    loadCities();
}

// ==========================
// 🔄 RESET
// ==========================
function resetSystem() {

    if (routeLine) map.removeLayer(routeLine);
    if (plane) map.removeLayer(plane);

    document.getElementById("result").innerText = "";
}