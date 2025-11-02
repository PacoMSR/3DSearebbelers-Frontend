import { useControls } from "leva";
import { toRadians } from "../Weather";

// disabled
// meant for debug use
export default function SceneControls({ weather, setWeather }) {
  const data = useControls("Presets", {
    seaState: {
      value: weather["seaState"],
      options: [
        "calm",
        "light air",
        "light breeze",
        "gentle breeze",
        "moderate breeze",
        "fresh breeze",
        "strong breeze",
        "near gale",
        "gale",
        "strong gale",
        "storm",
        "violent storm",
        "hurricane",
      ],
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          seaState: v,
        }));
      },
      render: (get) => get("use"),
    },
    fogState: {
      value: 0.5,
      min: 0.0,
      max: 4.0,
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          fogState: v,
        }));
      },
      render: (get) => get("use"),
    },
    cloudState: {
      value: 0.0,
      min: 0.0,
      max: 4.0,
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          cloudCover: v,
        }));
      },
      render: (get) => get("use"),
    },
    rainState: {
      value: 0.0,
      min: 0.0,
      max: 2.0,
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          rainState: v,
        }));
      },
      render: (get) => get("use"),
    },
    windDirection: {
      value: 15.0,
      min: 0.0,
      max: 360.0,
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          windDirection: [Math.cos(toRadians(v)), Math.sin(toRadians(v))],
        }));
      },
      render: (get) => get("use"),
    },
    skyState: {
      value: weather["skyState"],
      options: [
        "dawn",
        "sunrise",
        "morning",
        "noon",
        "afternoon",
        "dusk",
        "night",
      ],
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          skyState: v,
        }));
      },
      render: (get) => get("use"),
    },
    coastLine: {
      value: weather["coastLine"],
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          coastLine: v,
        }));
      },
      render: (get) => get("use"),
    },
    city: {
      value: weather["city"],
      options: ["Barcelona", "Capetown"],
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          city: v,
        }));
      },
      render: (get) => get("use"),
    },
    sunPos: {
      value: { x: weather["sunPos"].azimuth, y: weather["sunPos"].inclination },
      step: 0.01,
      joystick: "invertY",
      onChange: (v) => {
        setWeather((prev) => ({
          ...prev,
          sunPos: { azimuth: v.x, inclination: v.y },
        }));
      },
      render: (get) => get("use"),
    },
  });

  // data = { sea, fog, clouds, rain, wind, sky }
  return;
}
