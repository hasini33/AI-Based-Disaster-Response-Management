import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  useEffect(() => {
    const handleThemeChange = (event) => setDarkMode(event.detail === "dark")
    window.addEventListener("theme-changed", handleThemeChange)
    return () => window.removeEventListener("theme-changed", handleThemeChange)
  }, [])

  return (
    <button
      type="button"
      data-testid="button-toggle-theme"
      onClick={() => setDarkMode((previous) => !previous)}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 items-center gap-2 rounded-xl border border-[hsl(var(--line))] px-3 text-[hsl(var(--ink-soft))] transition hover:border-[hsl(var(--amber)/.45)] hover:bg-[hsl(var(--amber-soft))] hover:text-[hsl(var(--foreground))]"
    >
      {darkMode ? <Sun size={16} className="text-[hsl(var(--amber))]" /> : <Moon size={16} />}
      <span className="hidden text-[10px] font-bold uppercase tracking-wider sm:inline">
        {darkMode ? "Light" : "Dark"}
      </span>
    </button>
  )
}

export default ThemeToggle