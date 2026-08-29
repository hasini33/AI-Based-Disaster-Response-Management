import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Check,
  KeyRound,
  LogOut,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react"

const API_URL = "http://localhost:8000"

function applyTheme(theme) {
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark"
  )

  localStorage.setItem("theme", theme)

  window.dispatchEvent(
    new CustomEvent("theme-changed", {
      detail: theme,
    })
  )
}

function Settings() {
  const navigate = useNavigate()

  const [profileName, setProfileName] = useState("")
  const [email, setEmail] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") === "dark"
        ? "dark"
        : "light"
  )

  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [profileFeedback, setProfileFeedback] = useState("")
  const [passwordFeedback, setPasswordFeedback] = useState("")

  const token = localStorage.getItem("access_token")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        logout()
        return
      }

      const data = await response.json()

      setProfileName(data.name || "")
      setEmail(data.email || "")

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      )
    } catch (error) {
      setProfileFeedback(
        "Unable to connect to the server."
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()

    const cleanName = profileName.trim()

    if (!cleanName) {
      setProfileFeedback(
        "Enter a display name before saving."
      )
      return
    }

    setProfileSaving(true)
    setProfileFeedback("")

    try {
      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: cleanName,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        logout()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update profile."
        )
      }

      setProfileName(data.user.name)

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      )

      window.dispatchEvent(
        new Event("profile-updated")
      )

      setProfileFeedback(
        "Profile updated successfully."
      )
    } catch (error) {
      setProfileFeedback(
        error.message || "Unable to update profile."
      )
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()

    if (!currentPassword) {
      setPasswordFeedback(
        "Enter your current password."
      )
      return
    }

    if (newPassword.length < 6) {
      setPasswordFeedback(
        "Use at least 6 characters for a new password."
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback(
        "Passwords do not match."
      )
      return
    }

    setPasswordSaving(true)
    setPasswordFeedback("")

    try {
      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        logout()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to change password."
        )
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setPasswordFeedback(
        "Password changed successfully."
      )
    } catch (error) {
      setPasswordFeedback(
        error.message || "Unable to change password."
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  function logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("eoc-session")

    navigate("/login")
  }

  if (loading) {
    return (
      <div className="settings-page page-enter">
        <div className="settings-card">
          <p>Loading account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page page-enter">

      {/* ================= HEADER ================= */}
      <header
  className="
    mx-0
    mb-7
    flex
    items-center
    justify-between
    gap-6
    rounded-[20px]

    border
    border-[#d8cfbf]

    bg-gradient-to-r
    from-[#fffaf0]
    via-[#fffdf8]
    to-[#f7f8f9]

    px-8
    py-6

    shadow-[0_3px_8px_rgba(45,38,60,0.10)]

    dark:border-[#59465F]
    dark:bg-gradient-to-r
    dark:from-[#31233A]
    dark:via-[#31233A]
    dark:to-[#24192A]
    dark:shadow-[0_8px_25px_rgba(0,0,0,0.30)]

    transition-all
    duration-300
  "
>
  {/* LEFT SIDE */}
  <div className="flex items-center gap-5">

    {/* ICON */}
    <div
      className="
        flex
        h-[60px]
        w-[60px]
        shrink-0
        items-center
        justify-center
        rounded-[18px]

        bg-[#43BFA5]
        text-white

        shadow-[0_8px_18px_rgba(40,127,108,0.22)]

        dark:bg-[#5EB7A0]
        dark:text-[#31233A]
        dark:shadow-[0_8px_20px_rgba(94,183,160,0.20)]
      "
    >
      <UserRound
        size={29}
        strokeWidth={1.8}
      />
    </div>

    {/* TEXT */}
    <div>

      {/* EYEBROW */}
      <p
        className="
          mb-1
          text-[13px]
          font-medium
          uppercase
          tracking-[0.12em]

          text-[#287f6c]

          dark:text-[#5EB7A0]
        "
      >
        Operator Account
      </p>

      {/* TITLE */}
      <h1
        className="
          text-[38px]
          font-semibold
          leading-tight
          tracking-[-0.03em]

          text-[#332744]

          dark:text-[#F5EFE5]
        "
      >
        Profile &amp; Account
      </h1>

      {/* DESCRIPTION */}
      <p
        className="
          mt-1
          text-[16px]

          text-[#5d5264]

          dark:text-[#C8BFCB]
        "
      >
        Manage your operator profile and settings.
      </p>

    </div>
  </div>

  {/* RIGHT STATUS */}
  <div
    className="
      inline-flex
      shrink-0
      items-center
      gap-2
      rounded-full

      border
      border-[#9ed8cc]

      bg-[#d9f1eb]

      px-4
      py-2

      text-[13px]
      font-medium
      text-[#287f6c]

      dark:border-[#5EB7A0]/40
      dark:bg-[#5EB7A0]/15
      dark:text-[#5EB7A0]
    "
  >
    <span
      className="
        h-2
        w-2
        rounded-full

        bg-[#287f6c]

        dark:bg-[#5EB7A0]
      "
    />

    Account connected
  </div>
</header>

      {/* ================= CONTENT ================= */}

      <div className="settings-grid">

        {/* PROFILE */}
        <div className="section-card settings-card">

          <div className="settings-card__header">
            <span className="icon-chip">
              <UserRound size={17} />
            </span>

            <div>
              <h2>Operator profile</h2>

              <p>
                This name appears in your command console.
              </p>
            </div>
          </div>

          <form
            className="settings-form"
            onSubmit={handleProfileSubmit}
          >
            <div className="settings-field">

              <label htmlFor="profile-name">
                Profile name
              </label>

              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value)
                  setProfileFeedback("")
                }}
              />
            </div>

            <div className="settings-field">

              <label htmlFor="profile-email">
                Email
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                disabled
              />
            </div>

            <div className="settings-actions">

              <button
                type="submit"
                className="settings-button"
                disabled={profileSaving}
              >
                <Save size={14} />

                {profileSaving
                  ? "Saving..."
                  : "Save profile"}
              </button>

              {profileFeedback && (
                <span
                  className={`settings-feedback ${
                    profileFeedback.includes(
                      "successfully"
                    )
                      ? ""
                      : "settings-feedback--error"
                  }`}
                  role="status"
                >
                  {profileFeedback}
                </span>
              )}

            </div>
          </form>
        </div>

        {/* THEME */}
        <div className="section-card settings-card">

          <div className="settings-card__header">

            <span className="icon-chip icon-chip--amber">
              <Sun size={17} />
            </span>

            <div>
              <h2>Console appearance</h2>

              <p>
                Choose the contrast that suits your watch.
              </p>
            </div>

          </div>

          <div
            className="settings-theme-options"
            role="group"
            aria-label="Theme preference"
          >

            <button
              type="button"
              className={`settings-theme-option ${
                theme === "light" ? "active" : ""
              }`}
              aria-pressed={theme === "light"}
              onClick={() =>
                handleThemeChange("light")
              }
            >
              <Sun size={16} />

              Light mode

              {theme === "light" && (
                <Check
                  size={14}
                  className="ml-auto"
                />
              )}
            </button>

            <button
              type="button"
              className={`settings-theme-option ${
                theme === "dark" ? "active" : ""
              }`}
              aria-pressed={theme === "dark"}
              onClick={() =>
                handleThemeChange("dark")
              }
            >
              <Moon size={16} />

              Dark mode

              {theme === "dark" && (
                <Check
                  size={14}
                  className="ml-auto"
                />
              )}
            </button>

          </div>

          <p className="settings-account-note">
            Theme preference is saved on this device.
          </p>

        </div>

        {/* PASSWORD */}
        <div className="section-card settings-card">

          <div className="settings-card__header">

            <span className="icon-chip icon-chip--violet">
              <KeyRound size={17} />
            </span>

            <div>
              <h2>Change password</h2>

              <p>
                Update your account password securely.
              </p>
            </div>

          </div>

          <form
            className="settings-form"
            onSubmit={handlePasswordSubmit}
          >

            <div className="settings-field">

              <label htmlFor="current-password">
                Current password
              </label>

              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  setPasswordFeedback("")
                }}
              />

            </div>

            <div className="settings-field">

              <label htmlFor="new-password">
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  setPasswordFeedback("")
                }}
              />

            </div>

            <div className="settings-field">

              <label htmlFor="confirm-password">
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setPasswordFeedback("")
                }}
              />

            </div>

            <div className="settings-actions">

              <button
                type="submit"
                className="settings-button"
                disabled={passwordSaving}
              >
                <ShieldCheck size={14} />

                {passwordSaving
                  ? "Updating..."
                  : "Update password"}
              </button>

              {passwordFeedback && (
                <span
                  className={`settings-feedback ${
                    passwordFeedback.includes(
                      "successfully"
                    )
                      ? ""
                      : "settings-feedback--error"
                  }`}
                  role="status"
                >
                  {passwordFeedback}
                </span>
              )}

            </div>

          </form>
        </div>

        {/* LOGOUT */}
        <div
          className="
            section-card
            settings-card
            settings-danger
          "
        >

          <div className="settings-card__header">

            <span className="icon-chip icon-chip--alert">
              <LogOut size={17} />
            </span>

            <div>
              <h2>End session</h2>

              <p>
                Sign out of your emergency operations
                account.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="settings-button settings-button--danger"
            onClick={logout}
          >
            <LogOut size={14} />
            Log out
          </button>

        </div>

      </div>
    </div>
  )
}

export default Settings