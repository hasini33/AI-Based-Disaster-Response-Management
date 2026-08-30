import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"

const API_URL = "http://localhost:8000"

function Login() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState(
    () => localStorage.getItem("eoc-remembered-identifier") || ""
  )
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("eoc-remembered-identifier"))
  )
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!identifier.trim() || !password) {
      setFeedback({
        type: "error",
        message: "Enter your email and password to continue.",
      })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.")
      }

      // Store authentication
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (rememberMe) {
        localStorage.setItem(
          "eoc-remembered-identifier",
          identifier.trim()
        )
      } else {
        localStorage.removeItem("eoc-remembered-identifier")
      }

      // Go to dashboard
      navigate("/")
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Unable to connect to the server.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleForgotPassword(event) {
    event.preventDefault()

    setFeedback({
      type: "success",
      message:
        "Please contact the system administrator to reset your password.",
    })
  }

  return (
    <main className="auth-page page-enter">
      <section
        className="auth-visual"
        aria-labelledby="auth-platform-title"
      >
        <svg
          className="auth-map"
          viewBox="0 0 900 900"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            className="auth-map__contour"
            d="M30 160 C160 70, 250 140, 344 84 S560 85, 872 16"
          />
          <path
            className="auth-map__contour"
            d="M-30 284 C150 190, 228 300, 392 214 S640 250, 930 130"
          />
          <path
            className="auth-map__contour"
            d="M-24 570 C160 480, 278 605, 405 490 S690 530, 945 390"
          />
          <path
            className="auth-map__contour"
            d="M-40 720 C130 640, 245 762, 395 652 S690 730, 940 560"
          />
          <path
            className="auth-map__route"
            d="M-10 705 L154 596 L215 480 L405 451 L504 318 L730 250 L925 116"
          />
          <path
            className="auth-map__route"
            d="M84 0 L139 161 L215 480 L302 626 L356 904"
          />
          <path
            className="auth-map__route auth-map__route--alert"
            d="M62 794 L184 666 L374 649 L468 557 L651 548 L820 449"
          />
          <circle className="auth-map__pin" cx="215" cy="480" r="7" />
          <circle className="auth-map__pin" cx="504" cy="318" r="7" />
          <circle className="auth-map__pin" cx="651" cy="548" r="7" />
          <circle
            cx="215"
            cy="480"
            r="25"
            fill="none"
            stroke="hsl(9 78% 61% / .3)"
          />
          <circle
            cx="215"
            cy="480"
            r="43"
            fill="none"
            stroke="hsl(9 78% 61% / .18)"
          />
        </svg>

        <div className="auth-visual__content">
          

          <h1 className="auth-title" id="auth-platform-title">
            Disaster Response
            <span>Management System</span>
          </h1>

          <p className="auth-tagline">
            AI-Powered Emergency Resource Coordination
          </p>

          <div className="auth-status-strip">
            <Activity size={18} />
            <div>
              <strong>Operational intelligence, live</strong>
              <small>
                Situation feeds synchronised across the response network
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card__mark" aria-hidden="true">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </div>

          <h2>Welcome Back</h2>

          <p className="auth-card__subtitle">
            Sign in to continue to the Emergency Response Dashboard
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-identifier">
                Email
              </label>

              <div className="auth-input-wrap">
                <Mail size={16} />

                <input
                  className="auth-input"
                  id="login-identifier"
                  type="email"
                  autoComplete="username"
                  placeholder="coordinator@agency.gov"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-input-wrap">
                <LockKeyhole size={16} />

                <input
                  className="auth-input"
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((visible) => !visible)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="auth-form__meta">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                Remember me
              </label>

              <button
                type="button"
                className="auth-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {feedback && (
              <p
                className={`auth-feedback auth-feedback--${feedback.type}`}
                role="status"
              >
                {feedback.message}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="auth-card__footer">
            <KeyRound
              size={12}
              style={{
                verticalAlign: "middle",
                marginRight: 5,
              }}
            />
            Protected operations environment.
          </p>

          <button
            type="button"
            className="auth-link"
            onClick={() => navigate("/")}
          >
            Continue to read-only dashboard
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login