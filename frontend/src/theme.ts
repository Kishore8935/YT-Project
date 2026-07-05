export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function getTheme(): Theme {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    return next;
}
