export default function SubmitBar({ onSubmit, disabled }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-5 flex justify-end items-center gap-6 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="hidden sm:block text-right">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Confirm Information</p>
        <p className="text-[11px] text-gray-500 italic max-w-xs leading-tight">Ensure the prescription parameters match your doctor's orders.</p>
      </div>
      
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="relative group bg-blue-600 text-white px-10 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:bg-blue-700 shadow-xl shadow-blue-900/10 hover:shadow-blue-500/20 overflow-hidden"
      >
        <span className="relative z-10">Update Cart</span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}