import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import api from "../api"; // Import API wrapper
import AuthBackground from "../components/AuthBackground";

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",  // Changed to match Django model fields
    last_name: "",   // Changed to match Django model fields
    email: "",
    password: "",
    phone: "",
    role: "KenSAP",
  });
  const [error, setError] = useState("");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/register/", formData);

      if (response.status === 201) {
        setShowVerificationMessage(true);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <AuthBackground />
      <div className="auth-right">
        {showVerificationMessage && (
          <p className="success-message">
            Registration successful! Please check your email to verify your account.
          </p>
        )}
        <h2>Create an Account</h2>
        <p>Sign up to start your journey</p>
        {error && <p className="error-message">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>First Name</label>
          <input
            type="text"
            name="first_name"
            placeholder="Enter your first name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />

          <label>Last Name</label>
          <input
            type="text"
            name="last_name"
            placeholder="Enter your last name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
          />

          <label>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="KenSAP">KenSAP Student</option>
            <option value="Undergrad">Undergraduate</option>
            <option value="Alumni">Alumni</option>
          </select>

          <button type="submit" className="register-btn">Sign Up</button>
        </form>

        <p className="register-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>

  );
};

export default Register;