// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Auth.css";

const ResetPassword = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (password !== confirmPassword) {
            setError("❌ Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post(`/api/password-reset-confirm/${uid}/${token}/`, { password }, { headers: { Authorization: "" } });
            setMessage("✅ Password reset successful! Redirecting to login...");
            setTimeout(() => navigate("/"), 3000);
        } catch (err) {
            setError("❌ Invalid or expired reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-right">
                <div className="reset-form-container">
                    <h2 className="auth-title">Reset Your Password</h2>
                    <p className="auth-description">Enter a new password below.</p>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit} className="reset-form">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                        />

                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />

                        {password && confirmPassword && (
                            <p className="password-match">
                                {password === confirmPassword ? "✅ Passwords match" : "❌ Passwords do not match"}
                            </p>
                        )}

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? <div className="loading-spinner"></div> : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
