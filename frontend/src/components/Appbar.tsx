import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { getTheme, toggleTheme, type Theme } from "../theme";

export function Appbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
    const [searchQuery, setSearchQuery] = useState("");
    const [theme, setTheme] = useState<Theme>(getTheme());

    // Appbar never unmounts across route changes, so re-check localStorage
    // whenever the route changes (e.g. after Signin/Signup navigate away).
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("token"));
    }, [location.pathname]);

    function handleToggleTheme() {
        setTheme(toggleTheme());
    }

    function signOut() {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/");
    }

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/?search=${encodeURIComponent(q)}` : "/");
    }

    return (
        <div className="appbar">
            <div className="appbar-logo" onClick={() => navigate("/")}>
                <span className="appbar-logo-icon">▶</span>
                <span className="appbar-logo-text">StreamHub</span>
            </div>

            <form className="appbar-search" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="appbar-search-btn">🔍</button>
            </form>

            <div className="appbar-actions">
                <button
                    className="theme-toggle"
                    onClick={handleToggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? "☀️" : "🌙"}
                </button>
                {isLoggedIn ? (
                    <>
                        <button className="btn-secondary" onClick={() => navigate("/upload")}>
                            + Upload
                        </button>
                        <button className="btn-outline" onClick={signOut}>
                            Sign out
                        </button>
                    </>
                ) : (
                    <>
                        <button className="btn-outline" onClick={() => navigate("/signin")}>
                            Sign in
                        </button>
                        <button className="btn-primary" onClick={() => navigate("/signup")}>
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
