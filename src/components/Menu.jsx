import React, { useState } from "react";
import { Nav, Navbar, Button } from "react-bootstrap";

import Register from "./Register/Register";
import Login from "./Login/Login";
import Recording from "./Recording/Recording";

function Menu({
  currentUser,
  setCurrentUser,
  myStorage,
  setRecording,
  setIsLogbookActive,
}) {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLogbook, setShowLogbook] = useState(false);

  const handleLogout = () => {
    myStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <div>
      <Navbar bg="dark" variant={"dark"} expand="lg" className="menu">
        <div className="logo-image">
          <img src="logo-searebbel.png" className="img-fluid" />
        </div>
        <Nav className="me-auto" id={"nav-bar"}>
          <div className="btns">
            {currentUser ? (
              <Button
                className="btn logout"
                onClick={handleLogout}
                style={{ marginLeft: "10px" }}
              >
                Log out
              </Button>
            ) : (
              <>
                <Button
                  className="btn login"
                  onClick={() => {
                    setShowLogin(!showLogin);
                    setShowRegister(false);
                    setShowLogbook(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="btn register"
                  onClick={() => {
                    setShowRegister(!showRegister);
                    setShowLogin(false);
                    setShowLogbook(false);
                  }}
                >
                  Register
                </Button>
              </>
            )}
            <Button
              className="btn logbook"
              onClick={() => {
                setShowLogbook(!showLogbook);
                setShowRegister(false);
                setShowLogin(false);
              }}
            >
              Logbook
            </Button>
          </div>
        </Nav>
      </Navbar>
      {showRegister && <Register setShowRegister={setShowRegister} />}
      {showLogin && (
        <Login
          setShowLogin={setShowLogin}
          myStorage={myStorage}
          setCurrentUser={setCurrentUser}
        />
      )}
      {showLogbook && (
        <Recording
          setRecording={setRecording}
          setShowLogbook={setShowLogbook}
        />
      )}
    </div>
  );
}

export default Menu;
