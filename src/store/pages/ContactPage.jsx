import React, { useState } from "react";
import { FiPhoneCall, FiMail } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";

function ContactPage() {
  const [formData, setFormData] = useState({
    message: "",
    phone: "",
  });
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Thay bằng logic gọi API gửi thông tin của bạn sau này
    showToast("Thank you for your feedback!");
    setFormData({ message: "", phone: "" });
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* --- PHẦN FORM ĐÓNG GÓP Ý KIẾN --- */}
      <div className="max-w-6xl mx-auto px-6 py-16 bg-white rounded-2xl shadow-sm my-10 border border-stone-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Cột trái: Logo & Lời nhắn */}
          <div className="text-center md:text-left pr-0 md:pr-10">
            <h1 className="text-4xl font-bold tracking-widest text-stone-900 mb-6 flex items-center justify-center md:justify-start gap-2">
              FALCON <span className="text-blue-600 text-2xl">e</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-700 font-medium leading-relaxed">
              We always appreciate and look forward to receiving all feedback from customers to upgrade our service experience and products even better.
            </p>
            <div className="mt-8 hidden md:block w-12 h-0.5 bg-stone-300"></div>
          </div>

          {/* Cột phải: Form nhập liệu */}
          <div className="bg-white p-2">
            <h2 className="text-xl font-bold text-stone-900 mb-6 uppercase tracking-wide">
              Feedback
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Textarea */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase">
                  What would you like to tell Falcon?
                </label>
                <textarea
                  rows="4"
                  placeholder="Write your message to Falcon..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-300 focus:bg-white transition-colors resize-none"
                  required
                />
              </div>

              {/* Input SĐT */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2 uppercase">
                  Please provide your phone number <span className="text-red-500">❤️</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g., 0912121234"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-300 focus:bg-white transition-colors"
                  required
                />
                <p className="text-[11px] text-stone-500 mt-2 italic">
                  * Because Falcon might need to contact you if we need clarification on your feedback.
                </p>
              </div>

              {/* Nút Submit */}
              <button
                type="submit"
                className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors tracking-widest uppercase text-sm"
              >
                Send Now
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* --- PHẦN THÔNG TIN LIÊN HỆ BÊN DƯỚI (FOOTER ĐEN) --- */}
      <div className="bg-blue-950 text-white py-16 mt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            
            {/* Cột 1: Thông báo */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Feedback</h3>
              <p className="text-sm text-stone-400 leading-relaxed mb-6">
                We always appreciate and look forward to receiving all feedback from customers to upgrade our service experience and products even better.
              </p>
              <button className="px-6 py-2 bg-white text-stone-900 font-semibold rounded-full text-sm hover:bg-stone-200 transition-colors">
                LEAVE FEEDBACK
              </button>
            </div>

            {/* Cột 2: Hotline & Email */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-stone-400 text-sm mb-1">Hotline</p>
                <a href="tel:19009368" className="text-2xl font-bold flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <FiPhoneCall size={20} />
                  1900 9368
                </a>
                <p className="text-stone-500 text-sm mt-1">(9:00 - 22:00)</p>
              </div>
              <div>
                <p className="text-stone-400 text-sm mb-1">Email</p>
                <a href="mailto:hello@falconeyewear.com" className="text-lg font-bold flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <FiMail size={18} />
                  hello@falconeyewear.com
                </a>
              </div>
            </div>

            {/* Cột 3: Social Media Placeholder */}
            <div>
               <p className="text-stone-400 text-sm mb-4">Connect with us</p>
               <div className="flex gap-4">
                  {/* Thay thế bằng icon hoặc hình ảnh thật của bạn */}
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold cursor-pointer hover:opacity-80 transition-opacity">Fb</div>
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center font-bold cursor-pointer hover:opacity-80 transition-opacity">Za</div>
                  <div className="w-12 h-12 bg-black border border-stone-700 rounded-full flex items-center justify-center font-bold cursor-pointer hover:opacity-80 transition-opacity">TT</div>
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center font-bold cursor-pointer hover:opacity-80 transition-opacity">Ig</div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;