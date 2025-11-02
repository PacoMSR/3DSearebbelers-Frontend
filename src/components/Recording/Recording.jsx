import React from "react";
import { Cancel, Room } from "@mui/icons-material";
import { useState } from "react";

import "./recording.css";

export default function Recording({ setRecording, setShowLogbook }) {
  const [active, setActive] = useState(true);

  const onClickHandler = () => {
    setActive(false);
    setRecording(true);
  };

  return (
    <div className="logbookContainer">
      <div className="logo">
        <Room />
        Searebbelers
      </div>
      <div style={{ textAlign: "center" }}>
        {active
          ? "Do you want to create a Logbook of your route?"
          : "Creating Logbook of your route... Please wait."}
      </div>
      <div>
        <button
          className="logbookBtn"
          onClick={onClickHandler}
          style={{ visibility: !active && "hidden" }}
        >
          {active && "Create"}
        </button>
      </div>
      <Cancel className="logbookCancel" onClick={() => setShowLogbook(false)} />
    </div>
  );
}
