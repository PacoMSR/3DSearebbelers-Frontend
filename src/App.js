import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Menu from "./components/Menu";
import ReactMap from "./components/ReactMap";
import Scene from "./components/Scene/Scene";
import Weather from "./components/Weather";
import currentWeather from "./components/Scene/config/DefaultWeather.json";
import Logbook from "./components/Logbook";
import Embed from "./components/Embed";

// do not do this! hack to solve react encapsulation problems
// this variable contains app information
window.searebbel = {
  map: null, // neeeded to resize map anywhere
  // time: 0, // time
};

var showMap = true;
function changeView(clickedId) {
  // map on full screen
  if (showMap && document.getElementById(clickedId).className === "corner") {
    document.getElementById("canvas-container").className = "full";
    document.getElementById("canvas-container").style.width = "100vw";
    document.getElementById("canvas-container").style.height =
      "calc(100% - 55px)";
    document.getElementById("map-container").className = "corner";
    document.getElementById("map-container").style.width = "30vw";
    document.getElementById("map-container").style.height = "30vh";
    document.getElementById("sidebar").style.visibility = "hidden";
    showMap = !showMap;
  }
  // scene on full screen
  else if (
    !showMap &&
    document.getElementById(clickedId).className === "corner"
  ) {
    document.getElementById("map-container").className = "full";
    document.getElementById("map-container").style.width = "100vw";
    document.getElementById("map-container").style.height = "calc(100% - 55px)";
    document.getElementById("canvas-container").className = "corner";
    document.getElementById("canvas-container").style.width = "30vw";
    document.getElementById("canvas-container").style.height = "30vh";
    document.getElementById("sidebar").style.visibility = "visible";
    showMap = !showMap;
  }
  window.searebbel.map.resize(); //
}

export default function App() {
  // retrieve user if they were logged in previously
  const myStorage = window.localStorage;
  const [currentUser, setCurrentUser] = useState(myStorage.getItem("user"));
  const [currentBuoy, setCurrentBuoy] = useState(null); // selected buoy
  const [beacons, setBeacons] = useState(null); // all the buoys in the scene
  const [record, setRecording] = useState(false); // create logbook
  const [isLogbookActive, setIsLogbookActive] = useState("never"); // render logbook scene

  // boat information
  const [boat, setBoat] = useState({
    longitude: 2.46,
    latitude: 41.3,
    direction: Math.PI / 2,
    next: {
      longitude: 2.77,
      latitude: 41.49,
    },
    speed: 1.5,
    scale: [12, 20],
    length: 0.5,
  });

  // logboat information
  const [logbookBoat, setLogbookBoat] = useState({
    longitude: 2.46,
    latitude: 41.3,
    direction: Math.PI / 2,
    next: {
      longitude: 2.47,
      latitude: 41.4,
    },
    speed: 1.5,
  });

  const [weather, setWeather] = useState(currentWeather); // initial weather state
  const [logbookWeather, setLogbookWeather] = useState(currentWeather); // initial logbook weather state
  const [data, setData] = useState(null); // show data quad
  const [logbookData, setLogbookData] = useState(null); // show logbook data quad

  return (
    <div className="App">
      <Weather location={boat} setWeather={setWeather} />
      <Menu
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        myStorage={myStorage}
        setRecording={setRecording}
        setIsLogbookActive={setIsLogbookActive}
      />
      <Logbook
        record={record}
        setRecording={setRecording}
        setWeather={setLogbookWeather}
        setBoat={setLogbookBoat}
        setData={setLogbookData}
        setIsLogbookActive={setIsLogbookActive}
      />
      <div className="app-container">
        <Embed currentBuoy={currentBuoy} setCurrentBuoy={setCurrentBuoy} />
        <ReactMap
          currentUser={currentUser}
          setCurrentBuoy={setCurrentBuoy}
          changeView={changeView}
          setBeacons={setBeacons}
          boat={boat}
          setBoat={setBoat}
        />
        <div
          className="corner"
          style={{
            width: "30vw",
            height: "30vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          id="canvas-container"
          onClick={() => changeView("canvas-container")}
        >
          <Scene
            currentBuoy={currentBuoy}
            beacons={beacons}
            setBoat={setBoat}
            boat={boat}
            weather={weather}
            data={data}
            isActive={"always"}
          />
        </div>
      </div>
      {/* record canvas */}
      <div
        id="canvas-recorder"
        className="canvas-recorder"
        style={{
          width: "100vw",
          height: "100vh",
          visibility: "hidden",
        }}
      >
        <Scene
          currentBuoy={currentBuoy}
          beacons={beacons}
          setBoat={setLogbookBoat}
          boat={logbookBoat}
          weather={logbookWeather}
          data={logbookData}
          isActive={isLogbookActive}
        />
      </div>
    </div>
  );
}
