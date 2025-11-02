import axios from "axios";
import { useEffect } from "react";

import { WEATHER_API_URL, WEATHER_API_KEY } from "./api";

// weather api connection
export default function Weather({
  timestamp = new Date().getTime(),
  location,
  setWeather,
}) {
  const url = `${WEATHER_API_URL}?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${WEATHER_API_KEY}`;

  // fetch location weather
  const SearchLocation = () => {
    // fetch weather data
    axios
      .get(url)
      .then((res) => {
        // console.log("Current Weather in: ", res.data.name, " is\n", res.data);

        // map data to weather
        const weather = {
          fogState: 4 * (1 - res.data.visibility / 10000) + 0.6, // visibility from 0 to 10km -> fog from 0 to 4 (inverse)
          cloudCover: (4 * res.data.clouds.all) / 100, // % cloudiness -> from 0 to 4
          windDirection: [
            Math.cos(toRadians(res.data.wind.deg)),
            Math.sin(toRadians(res.data.wind.deg)),
          ], // wind direction in degrees to 2D vector
          rainState:
            res.data.rain === undefined ? 0.0 : mapRain(res.data.rain["1h"]), // mm to density from 0 to 2
          seaState: mapSea(res.data.wind.speed),
          skyState: mapSky(timestamp, location),
          sunPos: mapSun(timestamp, location),
          coastLine: true,
          city: "Barcelona", // hardcoded
        };

        setWeather(weather);
        // console.log("Scene: ", weather);
      })
      .catch(
        (
          err // if data can't be retrieved, use initial scene state preset
        ) => (
          console.log(
            "Using Weather Preset, could not fetch data from location.\nError:\n",
            err
          ),
          alert("Using Weather Preset, could not fetch data from location.")
        )
      );
  };

  // get data when component mounts
  useEffect(() => {
    SearchLocation();
  }, []);

  return;
}

export function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function mapRain(mm) {
  // from mm per 1h to density (max density: 2)
  // CEILING(SQRT(mm)) / 2
  return Math.min(Math.ceil(Math.sqrt(mm)) / 2.0, 2.0);
}

function mapSea(windSpeed) {
  // according to beaufort scale
  // https://blog.metservice.com/Sea_State_and_Swell

  var seaState;
  switch (true) {
    case windSpeed < 0.5:
      seaState = "calm";
      break;
    case windSpeed >= 0.5 && windSpeed < 1.5:
      seaState = "light air";
      break;
    case windSpeed >= 1.5 && windSpeed < 3.3:
      seaState = "light breeze";
      break;
    case windSpeed >= 3.3 && windSpeed < 5.5:
      seaState = "gentle breeze";
      break;
    case windSpeed >= 5.5 && windSpeed < 7.9:
      seaState = "moderate breeze";
      break;
    case windSpeed >= 7.9 && windSpeed < 10.7:
      seaState = "fresh breeze";
      break;
    case windSpeed >= 10.7 && windSpeed < 13.8:
      seaState = "strong breeze";
      break;
    case windSpeed >= 13.8 && windSpeed < 17.1:
      seaState = "near gale";
      break;
    case windSpeed >= 17.1 && windSpeed < 20.7:
      seaState = "gale";
      break;
    case windSpeed >= 20.7:
      seaState = "strong gale";
      break;

    default:
      seaState = "calm";
      break;
  }
  return seaState;
}

function mapSky(timestamp, location) {
  var SunCalc = require("suncalc"); // use library - https://github.com/mourner/suncalc

  // SkyState according to hour
  var times = SunCalc.getTimes(
    timestamp,
    location.latitude,
    location.longitude
  );

  var skyState = "morning";
  switch (true) {
    // dawn -> between night and dawn
    case timestamp > times.nightEnd.getTime() &&
      timestamp <= times.dawn.getTime():
      skyState = "dawn";
      break;
    // sunrise -> between dawn and sunrise
    case timestamp > times.dawn.getTime() &&
      timestamp <= times.sunriseEnd.getTime():
      skyState = "sunrise";
      break;
    // morning -> after sunrise
    case timestamp > times.sunriseEnd.getTime() &&
      timestamp < times.solarNoon.getTime():
      skyState = "morning";
      break;
    // noon -> between noon and golden hour
    case timestamp >= times.solarNoon.getTime() &&
      timestamp <= times.goldenHour.getTime():
      skyState = "noon";
      break;
    // afternoon -> after noon and before sunset
    case timestamp > times.goldenHour.getTime() &&
      timestamp < times.sunsetStart.getTime():
      skyState = "afternoon";
      break;
    // dusk -> between sunset and dusk
    case timestamp >= times.sunsetStart.getTime() &&
      timestamp <= times.dusk.getTime():
      skyState = "dusk";
      break;
    // night -> sun hasn't rised yet or has already setted
    case timestamp <= times.nightEnd.getTime() ||
      timestamp > times.dusk.getTime():
      skyState = "night";
      break;

    default:
      skyState = "noon";
      break;
  }

  return skyState;
}

function mapSun(timestamp, location) {
  var SunCalc = require("suncalc"); // use library - https://github.com/mourner/suncalc

  // Current sun position - azimuth + inclination
  var sunPos = SunCalc.getPosition(
    timestamp,
    location.latitude,
    location.longitude
  );

  sunPos.azimuth = sunPos.azimuth / (2 * Math.PI) - 0.25;
  sunPos.inclination = Math.max(sunPos.altitude, -0.02) / Math.PI + 0.5;

  // if night get moon position instead
  if (sunPos.altitude < -0.1) {
    sunPos = SunCalc.getMoonPosition(
      timestamp,
      location.latitude,
      location.longitude
    );

    sunPos.azimuth = sunPos.azimuth / (2 * Math.PI) + 0.5;
    sunPos.inclination = Math.max(sunPos.altitude, 0.0) / Math.PI + 0.5;
  }

  return sunPos;
}
