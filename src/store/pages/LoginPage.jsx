import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserById, loginApi } from "../api/authApi";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { loginGmail } from "../services/authService";
import { addToCartService } from "../services/cartService";

/* ── helper: merge guest cart into backend ── */
async function mergeGuestCart() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    const guestCart = JSON.parse(raw);
    if (!Array.isArray(guestCart) || guestCart.length === 0) return;

    for (const item of guestCart) {
      try {
        // Read prescription from nested object OR flat fields (both sources)
        const rx = item.prescription || {};

        await addToCartService({
          productId: item.productId || item.variant?.productId,
          variantId: item.variantId || item.variant?.variantId,
          quantity: item.quantity || 1,
          isLens: item.isLens || false,
          isPreorder: item.isPreOrder || item.isPreorder || false,
          sphLeft: item.sphLeft ?? rx.sphLeft ?? null,
          sphRight: item.sphRight ?? rx.sphRight ?? null,
          cylLeft: item.cylLeft ?? rx.cylLeft ?? null,
          cylRight: item.cylRight ?? rx.cylRight ?? null,
          axisLeft: item.axisLeft ?? rx.axisLeft ?? null,
          axisRight: item.axisRight ?? rx.axisRight ?? null,
          addLeft: item.addLeft ?? rx.addLeft ?? null,
          addRight: item.addRight ?? rx.addRight ?? null,
          pd: item.pd ?? rx.pd ?? null,
        });
      } catch (err) {
        console.warn("Failed to merge cart item:", err);
      }
    }

    // Clear guest cart after successful merge
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.warn("Guest cart merge failed:", e);
  }
}

/* ── decorative eyewear SVG lines ── */
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await loginApi(email, password);

      const decoded = jwtDecode(token);
      const getUserRaw = await getUserById(decoded.userId);
      localStorage.setItem("currentUser", JSON.stringify(getUserRaw));
      window.dispatchEvent(new Event("storage"));

      // Merge guest cart into backend
      await mergeGuestCart();

      if (decoded.role === "ADMIN" || decoded.role === "OPERATIONAL_STAFF")
        navigate("/dashboard");
      else navigate(from);
    } catch (error) {
      const status = error.status;
      console.log("Error Login with Status: ", status);
      if (status === 401) {
        setError("Incorrect email or password");
      } else {
        setError("Server connection error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      const name = decoded.name;

      // 3. login
      const token = await loginGmail(email, name);
      localStorage.setItem("token", token);

      // 4. decode token
      const userDecode = jwtDecode(token);
      console.log(userDecode);
      // 5. get user
      const res = await getUserById(userDecode.userId);

      localStorage.setItem("currentUser", JSON.stringify(res));

      window.dispatchEvent(new Event("storage"));

      // Merge guest cart into backend
      await mergeGuestCart();

      navigate(from);
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed.");
    }
  };

  return (
    <>
      <style>{`
        @keyframes lp-fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lp-fade-in  { from { opacity:0; } to { opacity:1; } }
        @keyframes lp-shimmer  { 0%,100% { opacity:.07; } 50% { opacity:.13; } }
        .lp-anim-0  { animation: lp-fade-up .55s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-1  { animation: lp-fade-up .55s .08s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-2  { animation: lp-fade-up .55s .16s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-3  { animation: lp-fade-up .55s .24s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-4  { animation: lp-fade-up .55s .32s cubic-bezier(.22,1,.36,1) both; }
        .lp-anim-5  { animation: lp-fade-up .55s .40s cubic-bezier(.22,1,.36,1) both; }
        .lp-panel   { animation: lp-fade-in .4s ease both; }
        .lp-input   { transition: border-color .18s, box-shadow .18s, background .18s; }
        .lp-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.13); background:#fff; }
        .lp-btn     { transition: background .18s, transform .1s, box-shadow .18s; }
        .lp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.18); }
        .lp-btn:active { transform:translateY(0); }
        .lp-shimmer { animation: lp-shimmer 3s ease-in-out infinite; }
      `}</style>

      <div
        className="fixed inset-0 flex z-50"
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* ═══════════════════════════════
            LEFT PANEL — dark visual
        ═══════════════════════════════ */}
        <div
          className="lp-panel hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, #0a0a0a 0%, #141414 40%, #1a1208 100%)",
          }}
        >
          {/* background image */}
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

          {/* noise texture */}
          <div
            className="absolute inset-0 lp-shimmer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              opacity: 0.06,
            }}
          />

          {/* center: quote */}
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

            {/* stats row */}
            <div className="flex gap-8 mt-10">
              {[
                ["500+", "Frames"],
                ["10K+", "Customers"],
                ["5★", "Reviews"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p
                    className="text-white font-bold text-xl"
                    style={{
                      color: "#2563eb",
                    }}
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

          {/* bottom: decorative line */}
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

        {/* ═══════════════════════════════
            RIGHT PANEL — form
        ═══════════════════════════════ */}
        <div
          className="flex-1 flex flex-col justify-center items-center px-8 md:px-14 overflow-y-auto"
          style={{ background: "#fafaf7" }}
        >
          <div className="w-full" style={{ maxWidth: 400 }}>
            {/* heading */}
            <div className="lp-anim-0 mb-8">
              <p
                className="text-xs font-medium tracking-widest mb-2"
                style={{ color: "#2563eb", letterSpacing: ".18em" }}
              >
                WELCOME BACK
              </p>
              <h1
                className="text-gray-900 font-bold leading-tight"
                style={{
                  fontSize: "2rem",
                }}
              >
                Login
                <br />
                <span
                  className="font-medium"
                  style={{ color: "#6b7280", fontSize: "1.4rem" }}
                >
                  to your account
                </span>
              </h1>
            </div>

            {/* error */}
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

            {/* form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* email */}
              <div className="lp-anim-1">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "#6b7280", letterSpacing: ".04em" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="lp-input w-full px-4 py-3 rounded-xl text-sm border bg-gray-50"
                  style={{ border: "1.5px solid #e5e7eb", color: "#111" }}
                />
              </div>

              {/* password */}
              <div className="lp-anim-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-xs font-medium"
                    style={{ color: "#6b7280", letterSpacing: ".04em" }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium transition-colors hover:opacity-80"
                    style={{ color: "#2563eb" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="lp-input w-full px-4 py-3 pr-12 rounded-xl text-sm border bg-gray-50"
                    style={{ border: "1.5px solid #e5e7eb", color: "#111" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  >
                    {showPass ? (
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
                    )}
                  </button>
                </div>
              </div>

              {/* submit */}
              <div className="lp-anim-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="lp-btn w-full py-3.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
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
                        <path d="M12 2v4" strokeOpacity="1" />
                      </svg>
                      Logging in…
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>

            {/* divider */}
            <div className="lp-anim-4 flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "#9ca3af" }}
              >
                or continue with
              </span>
              <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
            </div>

            {/* google */}
            <div className="lp-anim-5 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => setError("Google login failed.")}
                width="368"
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            {/* register link */}
            <p
              className="lp-anim-5 text-center text-sm mt-7"
              style={{ color: "#9ca3af" }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: "#2563eb" }}
              >
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
