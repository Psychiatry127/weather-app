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
   WEATHER FETCH
========================= */
async function getWeather(cityObj) {

  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  const weatherData = document.getElementById("weather-data");
  const result = document.getElementById("result");

  error.classList.add("hidden");
  weatherData.classList.add("hidden");
  result.classList.add("hidden");

  loading.classList.remove("hidden");

  try {
    const name = typeof cityObj === "string" ? cityObj : cityObj.name;

    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${API_KEY}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error();

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const airUrl =
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const airRes = await fetch(airUrl);
    const airData = await airRes.json();

    const air = airData.list[0].components;

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

    const icon = data.weather[0].icon;
    document.getElementById("icon").src =
      `https://openweathermap.org/img/wn/${icon}@2x.png`;

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

    result.classList.remove("hidden");
    weatherData.classList.remove("hidden");

  } catch (err) {
    error.innerText = "City not found or API error";
    error.classList.remove("hidden");
  }

  loading.classList.add("hidden");
}

/* =========================
   LOCATION FIXED VERSION
========================= */
function getUserLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  const loading = document.getElementById("loading");
  const error = document.getElementById("error");
  const weatherData = document.getElementById("weather-data");
  const result = document.getElementById("result");

  loading.classList.remove("hidden");
  error.classList.add("hidden");
  weatherData.classList.add("hidden");
  result.classList.add("hidden");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const url =
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error();

        getWeather({ name: data.name });

      } catch (err) {
        error.innerText = "Unable to fetch location weather";
        error.classList.remove("hidden");
      } finally {
        loading.classList.add("hidden");
      }
    },
    (err) => {
      loading.classList.add("hidden");

      error.innerText =
        err.code === 1
          ? "Location permission denied"
          : "Location unavailable";

      error.classList.remove("hidden");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}
