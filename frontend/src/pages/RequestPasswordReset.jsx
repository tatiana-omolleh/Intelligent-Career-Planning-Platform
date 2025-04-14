// src/pages/RequestPasswordReset.jsx
import React, { useState } from "react";
import api from "../api";
import "../styles/Auth.css";

const RequestPasswordReset = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await api.post("/api/password-reset/", { email }, { headers: { Authorization: "" } });
            setMessage("✅ Password reset link sent! Check your inbox.");
        } catch (err) {
            setError("❌ Failed to send reset link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-right">
                <div className="reset-form-container">
                    <h2 className="auth-title">Forgot Your Password?</h2>
                    <p className="auth-description">Enter your email, and we'll send a reset link to you.</p>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit} className="reset-form">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? <div className="loading-spinner"></div> : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestPasswordReset;
