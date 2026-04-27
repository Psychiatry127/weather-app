const API_KEY = "340015aad4c37be23a1e639ede417392";

const input = document.getElementById("cityInput");
const suggestionsBox = document.getElementById("suggestions");

let suggestionsData = [];
let activeIndex = -1;
let timeInterval = null;

/* =========================
   THEME TOGGLE
========================= */
const themeBtn = document.getElementById("themeToggle");

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  themeBtn.innerText = document.body.classList.contains("light")
    ? "☀️"
    : "🌙";
});

/* =========================
   SEARCH INPUT
========================= */
input.addEventListener("input", handleSearch);

input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    activeIndex++;
    updateActive();
  }

  if (e.key === "ArrowUp") {
    activeIndex--;
    updateActive();
  }

  if (e.key === "Enter") {
    if (activeIndex >= 0 && suggestionsData[activeIndex]) {
      selectCity(suggestionsData[activeIndex]);
    } else {
      getWeather(input.value);
    }
  }
});

/* =========================
   CITY SEARCH
========================= */
async function handleSearch() {
  const value = input.value;

  if (value.length < 3) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const url =
    `https://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=7&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  suggestionsData = data;
  activeIndex = -1;

  renderSuggestions();
}

function renderSuggestions() {
  suggestionsBox.innerHTML = "";

  suggestionsData.forEach((city, index) => {
    const div = document.createElement("div");
    div.classList.add("suggestion");

    if (index === activeIndex) div.classList.add("active");

    div.innerText = `${city.name}, ${city.country}`;

    div.onclick = () => selectCity(city);

    suggestionsBox.appendChild(div);
  });
}

function updateActive() {
  if (activeIndex < 0) activeIndex = 0;
  if (activeIndex >= suggestionsData.length)
    activeIndex = suggestionsData.length - 1;

  renderSuggestions();
}

function selectCity(city) {
  input.value = city.name;
  suggestionsBox.innerHTML = "";
  getWeather(city);
}

/* =========================
   WEATHER + FORECAST
========================= */
async function getWeather(cityObj) {

  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  const weatherData = document.getElementById("weather-data");
  const result = document.getElementById("result");

  const forecastBox = document.getElementById("forecast");

  error.classList.add("hidden");
  weatherData.classList.add("hidden");
  result.classList.add("hidden");
  forecastBox.innerHTML = "";

  loading.classList.remove("hidden");

  try {
    const name = typeof cityObj === "string" ? cityObj : cityObj.name;

    /* CURRENT WEATHER */
    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${API_KEY}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error();

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    updateRadar(lat, lon);

    /* AIR QUALITY */
    const airUrl =
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const airRes = await fetch(airUrl);
    const airData = await airRes.json();
    const air = airData.list[0].components;

    /* FORECAST */
    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    /* UI */
    document.getElementById("city").innerText =
      `${data.name}, ${data.sys.country}`;

    document.getElementById("temp").innerText =
      `${data.main.temp.toFixed(1)}°C`;

    document.getElementById("desc").innerText =
      data.weather[0].description;

    document.getElementById("feels").innerText =
      data.main.feels_like.toFixed(1);

    document.getElementById("min").innerText =
      data.main.temp_min.toFixed(1);

    document.getElementById("max").innerText =
      data.main.temp_max.toFixed(1);

    document.getElementById("humidity").innerText =
      data.main.humidity;

    document.getElementById("pressure").innerText =
      data.main.pressure;

    document.getElementById("visibility").innerText =
      data.visibility;

    document.getElementById("wind").innerText =
      Math.round(data.wind.speed);

    document.getElementById("clouds").innerText =
      data.clouds.all;

    document.getElementById("sunrise").innerText =
      new Date(data.sys.sunrise * 1000).toLocaleTimeString();

    document.getElementById("sunset").innerText =
      new Date(data.sys.sunset * 1000).toLocaleTimeString();

    /* AIR */
    document.getElementById("aqi").innerText = air.pm2_5;
    document.getElementById("pm10").innerText = air.pm10;
    document.getElementById("co").innerText = air.co;
    document.getElementById("no2").innerText = air.no2;

    document.getElementById("icon").src =
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    renderForecast(forecastData);

    /* TIME */
    function updateTime() {
      const utc =
        new Date().getTime() +
        new Date().getTimezoneOffset() * 60000;

      const cityTime = new Date(utc + data.timezone * 1000);

      document.getElementById("localTime").innerText =
        cityTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    }

    if (timeInterval) clearInterval(timeInterval);

    updateTime();

    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      updateTime();
      timeInterval = setInterval(updateTime, 60000);
    }, msUntilNextMinute);

    document.getElementById("weather-data").classList.remove("hidden");
    result.classList.remove("hidden");

  } catch (err) {
    error.innerText = "City not found or API error";
    error.classList.remove("hidden");
  }

  loading.classList.add("hidden");
}

/* =========================
   FORECAST
========================= */
function renderForecast(forecast) {

  const box = document.getElementById("forecast");
  box.innerHTML = "";

  const daily = {};
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  forecast.list.forEach(i => {
    const date = i.dt_txt.split(" ")[0];

    if (!daily[date] && i.dt_txt.includes("12:00:00")) {
      daily[date] = i;
    }
  });

  Object.values(daily).slice(0, 5).forEach(d => {

    const day = days[new Date(d.dt * 1000).getDay()];

    const div = document.createElement("div");
    div.className = "forecast-item";

    div.innerHTML = `
      <div>${day}</div>
      <img class="forecast-icon" 
        src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png"/>
      <div>${d.main.temp.toFixed(1)}°C</div>
      <div>${d.weather[0].main}</div>
    `;

    box.appendChild(div);
  });
}

/* =========================
   USER LOCATION
========================= */
function getUserLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    getWeather({ name: data.name });
  });
}

/* =========================
   RADAR
========================= */
function updateRadar(lat, lon) {
  const frame = document.getElementById("radar-frame");

  frame.src = "about:blank";

  setTimeout(() => {
    frame.src =
      `https://embed.windy.com/embed2.html` +
      `?lat=${lat}` +
      `&lon=${lon}` +
      `&zoom=6` +
      `&overlay=temp` +
      `&product=ecmwf` +
      `&level=surface`;
  }, 150);
}
