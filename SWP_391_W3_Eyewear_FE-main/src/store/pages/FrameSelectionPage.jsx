import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../services/productService";
import { formatPrice } from "../data/shopMock";

export default function FrameSelectionPage() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchFrames = async () => {
      try {
        setLoading(true);
        const products = await getAllProducts();
        if (cancelled) return;

        const onlyFrames = (products || []).filter(
          (p) => String(p?.category || "").toUpperCase() === "FRAME",
        );

        setFrames(onlyFrames);
      } catch (error) {
        console.error("Fetch frames error:", error);
        if (!cancelled) setFrames([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFrames();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFrameExists = useMemo(
    () => frames.some((f) => f.id === selectedFrame),
    [frames, selectedFrame],
  );

  return (
    <div className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6">Choose Your Frame</h1>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading frames...</div>
      ) : frames.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No frames available.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {frames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => setSelectedFrame(frame.id)}
              className={`border rounded-lg p-4 text-left transition
              ${
                selectedFrame === frame.id
                  ? "border-blue-600 ring-2 ring-blue-400"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img
                src={frame.img}
                alt={frame.name}
                className="h-32 w-full object-contain mb-4"
              />

              <div className="font-medium">{frame.name}</div>
              <div className="text-sm text-gray-500">{frame.brand}</div>
              <div className="mt-2 font-semibold">
                {formatPrice(Number(frame.price || 0))}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-8">
        <button
          disabled={!selectedFrame || !selectedFrameExists}
          onClick={() => navigate("/prescription")}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
