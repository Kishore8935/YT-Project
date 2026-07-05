import { useState } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import { API_URL } from "../config";

export function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [channelName, setChannelName] = useState("");
    const [gender, setGender] = useState("Male");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function signup() {
        if (!username || !password || !channelName) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await axios.post(`${API_URL}/api/signup`, {
                username, password, channelName, gender
            });
            localStorage.setItem("token", res.data.token);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.errors || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-title">Create account</div>
                <div className="auth-subtitle">Join YouTube today</div>

                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Choose a username (min 3 chars)"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        className="form-input"
                        type="password"
                        placeholder="Choose a password (min 6 chars)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Channel name</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Your channel name"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <button className="btn-primary" style={{ width: "100%" }} onClick={signup} disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                </button>

                <div className="auth-footer">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
