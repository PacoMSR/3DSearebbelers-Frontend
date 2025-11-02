import React from "react";
import { Cancel } from "@mui/icons-material";
import { format } from "timeago.js";

// buoy information div
export default function Embed({ currentBuoy, setCurrentBuoy }) {
  if (currentBuoy) {
    return (
      <div id="card" className="card">
        <Cancel className="embedCancel" onClick={() => setCurrentBuoy(null)} />
        <label>Type</label>
        <h4 className="place">{currentBuoy.buoyType}</h4>
        {currentBuoy.buoyType === "PHOTO" ? (
          <>
            <label>Content</label>
            {/* image hardcoded */}
            <img src={"./barcelona.jpg"} alt="Barcelona Coastline" />
          </>
        ) : (
          <></>
        )}
        <label>Information</label>
        <span className="username">
          Created by <b>{currentBuoy.ownerUsername}</b>
        </span>
        <span className="date">{format(currentBuoy.createdAt)}</span>
      </div>
    );
  }
  return;
}
