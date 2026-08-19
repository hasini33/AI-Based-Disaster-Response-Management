import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle("dark", darkMode)

    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  return (
    <button
      onClick={() => setDarkMode((prev) => !prev)}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className="
        flex items-center gap-2
        rounded-lg border
        px-3 py-2
        transition-colors duration-200

        border-gray-200
        bg-white
        text-gray-700
        hover:bg-gray-100

        dark:border-gray-700
        dark:bg-gray-800
        dark:text-gray-200
        dark:hover:bg-gray-700
      "
    >
      {darkMode ? (
        <>
          <Sun className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="text-sm font-medium">Dark</span>
        </>
      )}
    </button>
  )
}

export default ThemeToggle