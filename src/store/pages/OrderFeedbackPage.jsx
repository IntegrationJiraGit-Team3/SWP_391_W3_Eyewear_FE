import React, { useState } from "react";
import { FiStar } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";

function OrderFeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Thank you for your ${rating} star rating!`);
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2 tracking-tight">
          Rate Your Experience
        </h1>
        <p className="text-stone-500 mb-8">
          Order:{" "}
          <span className="font-medium text-stone-900">#FALCON-8899</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-3">
              How do you feel about the product?
            </label>
            <div className="flex gap-2">
              {[...Array(5)].map((star, index) => {
                const indexPlusOne = index + 1;
                return (
                  <button
                    type="button"
                    key={index}
                    className="focus:outline-none transition-transform hover:scale-110"
                    onClick={() => setRating(indexPlusOne)}
                    onMouseEnter={() => setHover(indexPlusOne)}
                    onMouseLeave={() => setHover(rating)}
                  >
                    <FiStar
                      size={32}
                      className={`${indexPlusOne <= (hover || rating) ? "fill-blue-500 text-blue-500" : "text-stone-300"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Share more about your experience
            </label>
            <textarea
              rows="5"
              placeholder="How was the quality of the glasses, was delivery fast?..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 resize-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!rating}
            className={`w-full py-3.5 mt-2 rounded-xl font-bold transition-colors ${
              rating
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrderFeedbackPage;
