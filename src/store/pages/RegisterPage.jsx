import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUser, checkEmail } from "../api/createApi";
/* ── decorative eyewear SVG (identical to LoginPage) ── */
function GlassesDecor({ className }) {
  return (
    <svg
      viewBox="0 0 220 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2"
        y="20"
        width="80"
        height="44"
        rx="22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity=".4"
      />
      <rect
        x="138"
        y="20"
        width="80"
        height="44"
        rx="22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity=".4"
      />
      <path
        d="M82 42 C95 36 125 36 138 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity=".35"
        strokeLinecap="round"
      />
      <path
        d="M2 42 L-28 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity=".3"
        strokeLinecap="round"
      />
      <path
        d="M218 42 L248 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity=".3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── eye toggle SVG ── */
function EyeIcon({ open }) {
  return open ? (
    <svg
      width="17"
      height="17"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="17"
      height="17"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── password strength helper ── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "#ef4444" },
    { label: "Average", color: "#2563eb" },
    { label: "Good", color: "#3b82f6" },
    { label: "Strong", color: "#22c55e" },
  ];
  return { score, ...map[score] };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getStrength(formData.password);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const emailExists = await checkEmail(formData.email);

      if (emailExists.data) {
        setError("Email already exists.");
        setLoading(false);
        return;
      }

      const newUser = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: "",
        role: "CUSTOMER",
        accountStatus: "ACTIVE",
      };

      await createUser(newUser);

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1600);
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes lp-fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lp-fade-in  { from { opacity:0; } to { opacity:1; } }
        @keyframes lp-shimmer  { 0%,100% { opacity:.07; } 50% { opacity:.13; } }
        @keyframes rp-check    { from { opacity:0; transform:scale(.7); } to { opacity:1; transform:scale(1); } }
        .lp-anim-0 { animation: lp-fade-up .55s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-1 { animation: lp-fade-up .55s .07s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-2 { animation: lp-fade-up .55s .14s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-3 { animation: lp-fade-up .55s .21s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-4 { animation: lp-fade-up .55s .28s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-5 { animation: lp-fade-up .55s .35s cubic-bezier(.22,1,.36,1) both; }
        .lp-panel  { animation: lp-fade-in .4s ease both; }
        .lp-input  { transition: border-color .18s, box-shadow .18s, background .18s; }
        .lp-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.13); background:#fff; }
        .lp-btn    { transition: background .18s, transform .1s, box-shadow .18s; }
        .lp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.18); }
        .lp-btn:active { transform:translateY(0); }
        .lp-shimmer { animation: lp-shimmer 3s ease-in-out infinite; }
        .rp-strength-bar { transition: width .3s cubic-bezier(.22,1,.36,1), background .3s; }
        .rp-success { animation: rp-check .4s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div
        className="fixed inset-0 flex z-50"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ════════════════════════════════
            LEFT PANEL — identical to Login
        ════════════════════════════════ */}
        <div
          className="lp-panel hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, #0a0a0a 0%, #141414 40%, #1a1208 100%)",
          }}
        >
          {/* bg image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
              opacity: 0.28,
            }}
          />

          {/* gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,.6) 0%, rgba(10,10,10,.25) 40%, rgba(10,10,10,.85) 100%)",
            }}
          />

          {/* noise */}
          <div
            className="absolute inset-0 lp-shimmer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              opacity: 0.06,
            }}
          />

          {/* quote */}
          <div className="relative z-10 px-10 pb-2 flex-1 flex flex-col justify-center">
            <GlassesDecor className="w-44 text-blue-400 mb-8 opacity-60" />
            <h2
              className="text-white leading-tight mb-5"
              style={{
                fontSize: "2.6rem",
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              Clear{" "}
              <span className="not-italic" style={{ color: "#2563eb" }}>
                Vision
              </span>
              ,<br />
              Endless <span style={{ color: "#2563eb" }}>Style</span>.
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,.5)", maxWidth: 340 }}
            >
              Glasses crafted specifically for your prescription and style. Each
              pair is an aesthetic statement.
            </p>
            <div className="flex gap-8 mt-10">
              {[
                ["500+", "Frames"],
                ["10K+", "Customers"],
                ["5★", "Reviews"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p
                    style={{
                      color: "#2563eb",
                    }}
                    className="font-bold text-xl"
                  >
                    {v}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255,255,255,.4)" }}
                  >
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* bottom line */}
          <div className="relative z-10 px-10 pb-8">
            <div
              className="h-px w-full mb-5"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(37,99,235,.4), transparent)",
              }}
            />
            <p
              className="text-xs"
              style={{ color: "rgba(255,255,255,.25)", letterSpacing: ".1em" }}
            >
              © 2026 OPTIQUE · Handcrafted eyewear
            </p>
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT PANEL — register form
        ════════════════════════════════ */}
        <div
          className="flex-1 flex flex-col justify-center items-center px-8 md:px-14 overflow-y-auto py-10"
          style={{ background: "#fafaf7" }}
        >
          <div className="w-full" style={{ maxWidth: 400 }}>
            {/* ── SUCCESS STATE ── */}
            {success ? (
              <div className="rp-success flex flex-col items-center text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(34,197,94,.1)",
                    border: "2px solid rgba(34,197,94,.3)",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p
                  className="text-xs font-medium tracking-widest mb-2"
                  style={{ color: "#2563eb", letterSpacing: ".18em" }}
                >
                  REGISTRATION SUCCESSFUL
                </p>
                <h2
                  className="text-gray-900 font-bold mb-2"
                  style={{
                    fontSize: "1.8rem",
                  }}
                >
                  Welcome!
                </h2>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  Redirecting to login page…
                </p>
                <div
                  className="mt-4 w-32 h-1 rounded-full overflow-hidden"
                  style={{ background: "#e5e7eb" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "#2563eb",
                      animation: "lp-fade-up 0s both",
                      width: "100%",
                      transition: "width 1.5s linear",
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* heading */}
                <div className="lp-anim-0 mb-7">
                  <p
                    className="text-xs font-medium tracking-widest mb-2"
                    style={{ color: "#2563eb", letterSpacing: ".18em" }}
                  >
                    NEW MEMBER
                  </p>
                  <h1
                    className="text-gray-900 font-bold leading-tight"
                    style={{
                      fontSize: "2rem",
                    }}
                  >
                    Register
                    <br />
                    <span
                      className="font-medium"
                      style={{ color: "#6b7280", fontSize: "1.4rem" }}
                    >
                      your account today
                    </span>
                  </h1>
                </div>

                {/* error banner */}
                {error && (
                  <div
                    className="lp-anim-0 flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm"
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4m0 4h.01" />
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* name */}
                  <div className="lp-anim-1">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "#6b7280", letterSpacing: ".04em" }}
                    >
                      Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="lp-input w-full px-4 py-3 rounded-xl text-sm border bg-gray-50"
                      style={{ border: "1.5px solid #e5e7eb", color: "#111" }}
                    />
                  </div>

                  {/* email */}
                  <div className="lp-anim-2">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "#6b7280", letterSpacing: ".04em" }}
                    >
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      autoComplete="email"
                      className="lp-input w-full px-4 py-3 rounded-xl text-sm border bg-gray-50"
                      style={{ border: "1.5px solid #e5e7eb", color: "#111" }}
                    />
                  </div>

                  {/* password */}
                  <div className="lp-anim-3">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "#6b7280", letterSpacing: ".04em" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPass ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        autoComplete="new-password"
                        className="lp-input w-full px-4 py-3 pr-12 rounded-xl text-sm border bg-gray-50"
                        style={{ border: "1.5px solid #e5e7eb", color: "#111" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                      >
                        <EyeIcon open={showPass} />
                      </button>
                    </div>
                    {/* strength bar */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="flex-1 h-1 rounded-full overflow-hidden"
                              style={{ background: "#e5e7eb" }}
                            >
                              <div
                                className="rp-strength-bar h-full rounded-full"
                                style={{
                                  width: strength.score >= i ? "100%" : "0%",
                                  background: strength.color,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: strength.color }}
                        >
                          {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* confirm password */}
                  <div className="lp-anim-4">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "#6b7280", letterSpacing: ".04em" }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="lp-input w-full px-4 py-3 pr-12 rounded-xl text-sm border bg-gray-50"
                        style={{
                          border: formData.confirmPassword
                            ? formData.confirmPassword === formData.password
                              ? "1.5px solid #22c55e"
                              : "1.5px solid #ef4444"
                            : "1.5px solid #e5e7eb",
                          color: "#111",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                      >
                        <EyeIcon open={showConfirm} />
                      </button>
                      {/* match indicator */}
                      {formData.confirmPassword && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          {formData.confirmPassword === formData.password ? (
                            <svg
                              width="15"
                              height="15"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#22c55e"
                              strokeWidth="2.5"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg
                              width="15"
                              height="15"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#ef4444"
                              strokeWidth="2.5"
                            >
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* submit */}
                  <div className="lp-anim-5 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="lp-btn w-full py-3.5 rounded-xl text-sm font-semibold text-white"
                      style={{
                        background: loading ? "#9ca3af" : "#2563eb",
                        letterSpacing: ".04em",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <svg
                            className="animate-spin"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                              strokeOpacity=".4"
                            />
                            <path d="M12 2v4" />
                          </svg>
                          Creating account…
                        </span>
                      ) : (
                        "Register"
                      )}
                    </button>
                  </div>
                </form>

                {/* login link */}
                <p
                  className="lp-anim-5 text-center text-sm mt-6"
                  style={{ color: "#9ca3af" }}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold transition-colors hover:opacity-80"
                    style={{ color: "#2563eb" }}
                  >
                    Login now
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
