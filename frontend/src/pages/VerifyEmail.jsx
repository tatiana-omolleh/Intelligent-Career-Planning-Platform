import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Auth.css"; // Add styles

const VerifyEmail = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("Verifying your email...");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUserEmail = async () => {
            try {
                const res = await api.get(`/api/verify-email/${uid}/${token}/`);
                if (res.status === 200) {
                    setMessage("✅ Email verified successfully! Redirecting to login...");
                    setTimeout(() => navigate("/"), 3000);
                }
            } catch (err) {
                // setError("❌ Verification link is invalid or has expired.");
            } finally {
                setLoading(false);
            }
        };
        verifyUserEmail();
    }, [uid, token, navigate]);
    

    return (
        <div className="auth-container">
            <div className="auth-right">
                <h1>Email Verification</h1>

                {loading ? (
                    <div className="loading-spinner"></div> // Show spinner
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <p>{message}</p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
