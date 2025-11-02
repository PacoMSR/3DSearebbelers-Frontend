import React from "react";
import { Cancel, Room } from "@mui/icons-material";
import { useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

import "./login.css";

function Login({ setShowLogin, myStorage, setCurrentUser }) {
  const [error, setError] = useState(false);
  const nameRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = {
      username: nameRef.current.value,
      password: passwordRef.current.value,
    };
    try {
      const res = await axios.post(`${API_BASE_URL}/app/users/login`, user);
      myStorage.setItem("user", res.data.username);
      setCurrentUser(res.data.username);
      setShowLogin(false);
      setError(false);
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="loginContainer">
      <div className="logo">
        <Room />
        Searebbelers
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="username" ref={nameRef}></input>
        <input type="password" placeholder="password" ref={passwordRef}></input>
        <button className="loginBtn">Login</button>
        {error && <span className="failure">Something went worng...</span>}
      </form>
      <Cancel className="loginCancel" onClick={() => setShowLogin(false)} />
    </div>
  );
}

export default Login;
