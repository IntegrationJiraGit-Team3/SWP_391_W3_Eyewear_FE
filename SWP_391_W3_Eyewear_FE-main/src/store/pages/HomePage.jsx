import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import glassesImg1 from "../image/image1.jpg";
import glassesImg2 from "../image/image2.jpg";
import glassesImg3 from "../image/image3.jpg";
import {
  FiSettings,
  FiTruck,
  FiEye,
  FiRepeat,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiShoppingBag,
  FiLock,
  FiCheck,
} from "react-icons/fi";

//mock data thay bằng api sau này
import { products } from "../data/shopMock";

/* ===== DATA ===== */
const sliderData = [
  {
    id: 1,
    title: "Modern Eyewear",
    subtitle: "2026 Collection",
    desc: "Minimalist and elegant designs for everyday comfort.",
    image: glassesImg1,
  },
  {
    id: 2,
    title: "Premium Optics",
    subtitle: "Experience",
    desc: "Enjoy crystal-clear vision with advanced lens technology.",
    image: glassesImg2,
  },
  {
    id: 3,
    title: "Limited Edition",
    subtitle: "Selection",
    desc: "Exclusive summer collection crafted just for you.",
    image: glassesImg3,
  },
];

const services = [
  {
    icon: <FiSettings size={22} />,
    title: "Eyeglass Maintenance",
    desc: "Free cleaning and adjustments for life.",
  },
  {
    icon: <FiTruck size={22} />,
    title: "Fast Delivery",
    desc: "Free delivery on orders over 1 million VND.",
  },
  {
    icon: <FiRepeat size={22} />,
    title: "Trade-in Program",
    desc: "Attractive discounts on new glasses upgrades.",
  },
  {
    icon: <FiEye size={22} />,
    title: "Free Eye Examination",
    desc: "Professional technicians, state-of-the-art equipment.",
  },
];

/* ===== LOGIN MODAL ===== */
function LoginModal({ isOpen, onClose, productName }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* Accent line */}
        <div className="h-0.5 w-full bg-blue-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
        >
          <FiX size={16} />
        </button>

        <div className="px-8 pt-8 pb-10">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <FiLock size={18} className="text-blue-600" />
          </div>

          <div className="text-center mb-7">
            <h3 className="text-lg font-semibold text-stone-900 mb-2 tracking-tight">
              Đăng nhập để tiếp tục
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              {productName ? (
                <>
                  Bạn cần đăng nhập để thêm{" "}
                  <span className="font-medium text-stone-700">
                    "{productName}"
                  </span>{" "}
                  vào giỏ hàng.
                </>
              ) : (
                "Vui lòng đăng nhập để mua sắm."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                const from = `${location.pathname}${location.search}${location.hash}`;
                navigate("/login", { state: { from } });
              }}
              className="w-full py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all text-sm tracking-wide active:scale-95"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/register");
              }}
              className="w-full py-3 border border-stone-200 cursor-pointer hover:border-stone-300 hover:bg-stone-50 text-stone-700 font-medium rounded-xl transition-all text-sm tracking-wide active:scale-95"
            >
              Tạo tài khoản
            </button>
          </div>

          <p className="text-center text-xs text-stone-400 mt-5">
            <button
              onClick={onClose}
              className="hover:text-stone-700 transition-colors cursor-pointer"
            >
              Tiếp tục xem sản phẩm
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== TOAST ===== */
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-5 py-3 rounded-full text-sm font-medium shadow-xl flex items-center gap-2"
      style={{ animation: "slideUp 0.3s ease" }}
    >
      <FiCheck size={14} className="text-green-400" />
      {message}
    </div>
  );
}

/* ===== MAIN ===== */
function HomePage() {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [visibleSections, setVisibleSections] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p === sliderData.length - 1 ? 0 : p + 1));
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting)
            setVisibleSections((p) => ({ ...p, [e.target.id]: true }));
        }),
      { threshold: 0.1 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const prevSlide = () => {
    clearInterval(intervalRef.current);
    setCurrent((p) => (p === 0 ? sliderData.length - 1 : p - 1));
  };

  const nextSlide = () => {
    clearInterval(intervalRef.current);
    setCurrent((p) => (p === sliderData.length - 1 ? 0 : p + 1));
  };

  const rv = (id) =>
    visibleSections[id]
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-6";

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(-18px) } to { opacity: 1; transform: translateX(0) } }

        .slide-in   { animation: slideLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .slide-in-d1 { animation: slideLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.07s both; }
        .slide-in-d2 { animation: slideLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both; }
        .slide-in-d3 { animation: slideLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.21s both; }

        .product-card { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.09); }
      `}</style>

      <main
        className="w-full bg-white text-stone-800"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <LoginModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setPendingProduct(null);
          }}
          productName={pendingProduct?.name}
        />

        {/* ── HERO ── */}
        <section className="relative w-full h-screen max-h-[720px] min-h-[520px] overflow-hidden bg-blue-950">
          {sliderData.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                style={{
                  transform: i === current ? "scale(1.04)" : "scale(1)",
                  transition: "transform 7s ease",
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
            </div>
          ))}

          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 lg:px-28">
            <div key={current}>
              <p className="slide-in text-blue-300 tracking-[0.35em] uppercase text-[11px] font-medium mb-5">
                New Collection 2026
              </p>
              <h1 className="slide-in-d1 text-5xl md:text-7xl font-semibold text-white leading-[1.05] tracking-tight mb-2">
                {sliderData[current].title}
              </h1>
              <h2 className="slide-in-d1 text-5xl md:text-7xl font-light text-white leading-[1.05] tracking-tight mb-6">
                {sliderData[current].subtitle}
              </h2>
              <p className="slide-in-d2 text-gray-200 text-sm max-w-xs mb-8 leading-relaxed">
                {sliderData[current].desc}
              </p>
              <div className="slide-in-d3 flex items-center gap-4">
                <Link to="/shop">
                  <button className="px-6 py-2.5 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-medium text-sm tracking-wide rounded-full transition-all active:scale-95">
                    Discover
                  </button>
                </Link>
                <button className="text-stone-400 hover:text-white text-sm transition-colors flex items-center gap-1.5">
                  <span className="w-6 h-px bg-stone-500 inline-block" />
                  View more
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center backdrop-blur-sm transition-all"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center backdrop-blur-sm transition-all"
          >
            <FiChevronRight size={16} />
          </button>

          <div className="absolute bottom-8 left-8 md:left-20 lg:left-28 flex items-center gap-2">
            {sliderData.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-1 bg-white" : "w-1 h-1 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>

          <div className="absolute bottom-8 right-8 text-white/30 text-xs tracking-widest tabular-nums">
            0{current + 1} / 0{sliderData.length}
          </div>
        </section>

        {/* ── BRAND STRIP ── */}
        <section className="border-y border-stone-100 py-4 bg-stone-50/60">
          <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-stone-400 text-[11px] tracking-[0.22em] uppercase font-medium">
            {[...new Set(products.map((p) => p.brand))].map((brand) => (
              <span
                key={brand}
                className="hover:text-stone-600 transition-colors cursor-default"
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="relative bg-stone-50 py-24 overflow-hidden">
          {/* subtle background decoration */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-30" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-40" />

          <div className="relative max-w-6xl mx-auto px-6">
            <div
              id="services-header"
              data-reveal
              className={`text-center mb-16 transition-all duration-700 ${rv("services-header")}`}
            >
              <p className="text-stone-400 text-[11px] tracking-[0.3em] uppercase font-medium mb-4">
                Our Service
              </p>

              <h2 className="text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
                Commitment
              </h2>

              <div className="w-16 h-[2px] bg-blue-600 mx-auto mt-6" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((item, i) => (
                <div
                  key={i}
                  id={`service-${i}`}
                  data-reveal
                  style={{ transitionDelay: `${i * 0.1}s` }}
                  className={`group relative p-8 bg-white border border-stone-200 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${rv(
                    `service-${i}`,
                  )}`}
                >
                  {/* icon */}
                  <div
                    className="w-16 h-16 mx-auto mb-6 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 
                          transition-all duration-300
                          group-hover:bg-blue-600 group-hover:text-white"
                  >
                    {item.icon}
                  </div>

                  {/* title */}
                  <h3 className="text-lg font-semibold text-stone-900 mb-3 tracking-tight">
                    {item.title}
                  </h3>

                  {/* description */}
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* subtle hover border effect */}
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-blue-400 transition-all duration-500 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          id="cta"
          data-reveal
          className={`relative py-28 overflow-hidden bg-blue-950 transition-all duration-700 ${rv("cta")}`}
        >
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-white/[0.04]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full border border-white/[0.04]" />

          <div className="relative max-w-2xl mx-auto text-center px-6 z-10">
            <p className="text-blue-300 text-[11px] tracking-[0.3em] uppercase font-medium mb-5">
              Start your journey
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 leading-tight tracking-tight">
              Find the perfect pair of glasses
            </h2>
            <p className="text-stone-400 mb-10 text-sm max-w-sm mx-auto leading-relaxed">
              Thousands of high-quality frames and lenses. Book an eye exam
              today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/shop">
                <button className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm tracking-wide rounded-full transition-all active:scale-95">
                  Shop now
                </button>
              </Link>
              <button className="px-7 py-3 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-white font-medium text-sm tracking-wide rounded-full transition-all active:scale-95">
                Find a store
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default HomePage;
