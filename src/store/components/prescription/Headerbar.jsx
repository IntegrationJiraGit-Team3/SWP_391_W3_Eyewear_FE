import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, HelpCircle } from "lucide-react";

export default function HeaderBar() {
  const navigate = useNavigate();
  return (
    <div className="sticky top-[68px] z-[40] h-16 flex items-center justify-between px-8 bg-white border-b border-gray-100 shadow-sm transition-all duration-300">

      <button className="flex items-center gap-2 text-sm  hover:bg-gray-100 rounded-full transition" onClick={() => navigate("/")}>
        <ArrowLeft size={18}/>
        Back
      </button>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <HelpCircle size={16}/>
        Learn more about digital prescriptions
      </div>

      <button>
        <X size={20}/>
      </button>

    </div>
  );
}