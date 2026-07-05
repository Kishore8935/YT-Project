import { useState } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { API_URL } from "../config";

export function Signin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function signin() {
        if (!username || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await axios.post(`${API_URL}/api/signin`, { username, password });
            localStorage.setItem("token", res.data.token);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.errors || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-title">Sign in</div>
                <div className="auth-subtitle">Welcome back</div>

                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && signin()}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        className="form-input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && signin()}
                    />
                </div>

                <button className="btn-primary" style={{ width: "100%" }} onClick={signin} disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                </button>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
