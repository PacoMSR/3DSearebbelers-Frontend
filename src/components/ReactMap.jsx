import React, { useState, useEffect, useRef } from "react";
import Map, { FullscreenControl, Marker, Popup } from "react-map-gl";
import {
  Circle,
  DirectionsBoat,
  LocationSearching,
  RoomTwoTone,
  Room,
} from "@mui/icons-material";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

import "../index.css";
import { MAPBOX_TOKEN, API_BASE_URL } from "./api";
import route from "./Scene/config/Route.json";

// array of colors depending on buoy type
const buoycolor = {
  JELLYFISH: "#7600bc",
  SEAWEED: "#00ab41",
  PHOTO: "#e69b00",
  VIDEO: "#dc6601",
};

function ReactMap({
  currentUser,
  setCurrentBuoy,
  changeView,
  setBeacons,
  boat,
  setBoat,
}) {
  const mapRef = useRef();
  const [buoys, setBuoys] = useState([]); // array of buoys
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [buoyType, setBuoyType] = useState("JELLYFISH");
  const [viewState, setViewState] = useState({
    longitude: 2.46,
    latitude: 41.3,
    zoom: 9,
  });

  useEffect(() => {
    // retrieve buoys from database
    const getBuoys = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/app/buoys`);
        setBuoys(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    if (buoys.length === 0) {
      getBuoys();
    }
    setBeacons(buoys); // pass information to App component
  }, [buoys]);

  useEffect(() => {}, [boat]);

  // select marker (buoy) on scene
  const handleMarkerClick = (b) => {
    setCurrentPlaceId(b._id);
    setCurrentBuoy(b);
  };

  // add marker (buoy) to scene
  const handleAddClick = (e) => {
    if (currentUser === null) {
      alert("Login to add Buoys!");
      return;
    }
    setNewPlace({
      lat: e.lngLat["lat"],
      lng: e.lngLat["lng"],
    });
  };

  // form of new marker (buoy)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newBuoy = {
      buoyType,
      ownerUsername: currentUser,
      coordinates: {
        lat: newPlace.lat,
        lng: newPlace.lng,
        depth: 0,
      },
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/app/buoys`, newBuoy);
      setBuoys([...buoys, res.data]);
      setBeacons([...buoys, res.data]);
      setNewPlace(null);
    } catch (err) {
      console.log(err);
    }
  };

  // move boat across map
  const handleBoatDrag = (e) => {
    setBoat((prev) => ({ ...prev, longitude: e.lng, latitude: e.lat }));
  };

  return (
    <div
      className="full"
      id="map-container"
      onClick={(e) => {
        if (e.target.className === "mapboxgl-canvas") {
          changeView("map-container");
          setCurrentPlaceId(null);
          setCurrentBuoy(null);
        }
      }}
    >
      <div className="sidebar" id="sidebar">
        Long: {viewState.longitude.toFixed(2)} | Lat:{" "}
        {viewState.latitude.toFixed(2)} | Zoom: {viewState.zoom.toFixed(1)}
      </div>

      <Map
        {...viewState}
        ref={mapRef}
        id="map"
        onMove={(evt) => {
          setViewState(evt.viewState);
        }}
        mapStyle="mapbox://styles/carolina-dcf/cl803kaf2001415mq3c3v3fse"
        mapboxAccessToken={MAPBOX_TOKEN}
        onDblClick={handleAddClick}
        doubleClickZoom={false}
        onLoad={(e) => (window.searebbel.map = e.target)}
      >
        {/* buoys markers */}
        {buoys.map((b) => (
          <>
            <Marker
              key={b._id}
              longitude={b.coordinates.lng}
              latitude={b.coordinates.lat}
              offsetLeft={-viewState.zoom * 2}
              offsetTop={-viewState.zoom * 4}
            >
              <Room
                style={{
                  fontSize: viewState.zoom * 4,
                  cursor: "pointer",
                  color: buoycolor[b.buoyType],
                }}
                onClick={() => handleMarkerClick(b)}
              />
              <Circle
                style={{
                  fontSize: viewState.zoom * 1,
                  cursor: "pointer",
                  color: b.ownerUsername === currentUser ? "tomato" : "teal",
                  position: "relative",
                  left: -viewState.zoom * 2.5,
                  top: -viewState.zoom * 0.5,
                  display: "none",
                }}
              />
            </Marker>
          </>
        ))}

        {/* boat marker */}
        <Marker
          longitude={boat.longitude}
          latitude={boat.latitude}
          draggable
          onDrag={(e) => handleBoatDrag(e.lngLat)}
          rotation={-(boat.direction * 180) / Math.PI - 180}
        >
          <DirectionsBoat
            style={{
              fontSize: viewState.zoom * 3,
              cursor: "pointer",
            }}
          />
        </Marker>

        {/* route markers */}
        {route.map((point) => (
          <>
            {point.longitude === boat.longitude &&
            point.latitude === boat.latitude ? (
              <></>
            ) : (
              <Marker longitude={point.longitude} latitude={point.latitude}>
                <LocationSearching
                  style={{
                    fontSize: viewState.zoom * 2,
                    cursor: "pointer",
                  }}
                />
              </Marker>
            )}
          </>
        ))}

        {/* new place form */}
        {newPlace && (
          <Popup
            latitude={newPlace.lat}
            longitude={newPlace.lng}
            closeButton={true}
            closeOnClick={false}
            anchor="left"
            onClose={() => setNewPlace(null)}
          >
            <div className="buoy-form">
              <form onSubmit={handleSubmit}>
                <label>Buoy Type</label>
                <select onChange={(e) => setBuoyType(e.target.value)}>
                  <option value="JELLYFISH" selected>
                    JELLYFISH
                  </option>
                  <option value="SEAWEED">SEAWEED</option>
                  <option value="PHOTO">PHOTO</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
                <button className="submit-btn" type="submit">
                  Add Bouy
                </button>
              </form>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default ReactMap;
