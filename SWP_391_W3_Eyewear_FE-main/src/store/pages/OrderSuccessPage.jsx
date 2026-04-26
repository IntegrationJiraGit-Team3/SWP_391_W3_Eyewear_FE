import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiTruck, FiChevronRight, FiShoppingBag } from 'react-icons/fi';

function OrderSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const orderData = location.state?.order;

    if (!orderData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white px-4">
                <div className="text-center">
                    <FiShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium mb-6">No order data found</p>
                    <Link to="/" className="text-blue-600 font-bold hover:underline">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center px-4 py-20">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 relative overflow-hidden"
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-full -ml-12 -mb-12 z-0" />

                <div className="relative z-10 text-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        >
                            <FiCheckCircle size={48} className="text-emerald-500" />
                        </motion.div>
                    </div>

                    <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Order Successful!</h2>
                    <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                        Thank you for choosing <span className="text-blue-600 font-bold tracking-tighter italic">FALCON</span>. 
                        Your premium order is now being processed.
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-slate-50 rounded-[32px] p-6 mb-10 text-left border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white pb-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Order ID</p>
                                <p className="text-sm font-black text-slate-900"># {orderData.orderCode || orderData.id || orderData.orderId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Date</p>
                                <p className="text-sm font-bold text-slate-700">{orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : 'Just now'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-600">
                             <FiPackage size={16} />
                             <p className="text-xs font-bold uppercase tracking-tight">Preparing for shipment</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => navigate(`/shipping-progress/${orderData.orderId || orderData.id}`)}
                            className="group w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                        >
                            <FiTruck size={18} />
                            Track Progress
                            <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <Link to="/" className="w-full text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default OrderSuccessPage;