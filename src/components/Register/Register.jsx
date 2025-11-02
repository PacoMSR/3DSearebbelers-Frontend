import React from "react";
import { useRef, useState } from "react";
import { Cancel, Room } from "@mui/icons-material";
import axios from "axios";
import { API_BASE_URL } from "../api";

import "./register.css";

function Register({ setShowRegister }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = {
      username: nameRef.current.value,
      email: emailRef.current.value,
      password: passwordRef.current.value,
    };
    try {
      await axios.post(`${API_BASE_URL}/app/users/register`, newUser);
      setSuccess(true);
      setError(false);
      setErrorMessage("");
    } catch (err) {
      setError(true);
      setSuccess(false);
      // Display specific error message from backend
      if (err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="registerContainer">
      <div className="Reglogo">
        <Room />
        Searebbelers
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="username" ref={nameRef}></input>
        <input type="email" placeholder="email" ref={emailRef}></input>
        <input type="password" placeholder="password" ref={passwordRef}></input>
        <button className="registerBtn">Register</button>
        {success && (
          <span className="success">Successful. You can login now!</span>
        )}
        {error && <span className="failure">{errorMessage}</span>}
      </form>
      <Cancel
        className="registerCancel"
        onClick={() => setShowRegister(false)}
      />
    </div>
  );
}

export default Register;
