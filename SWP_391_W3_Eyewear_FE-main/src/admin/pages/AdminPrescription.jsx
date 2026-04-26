import { useCallback, useMemo, useState, useEffect, memo } from "react";
import {
  getAllPrescriptionsApi,
  approvePrescriptionApi,
  declinePrescriptionApi,
  createOfflinePrescriptionApi,
} from "../api/prescriptionApi";
import { updateOrderStatus } from "../services/orderService";
import { useToast } from "../../context/ToastContext";
import {
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiEye,
  FiPlus,
  FiFileText,
  FiUser,
  FiChevronUp,
  FiChevronDown,
  FiUpload,
  FiAlertCircle,
  FiClock,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/* ── status config ── */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-400",
    icon: <FiClock size={12} />,
  },
  approved: {
    label: "Approved",
    badge: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
    icon: <FiCheck size={12} />,
  },
  declined: {
    label: "Declined",
    badge: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-400",
    icon: <FiX size={12} />,
  },
};

const EMPTY_RX = {
  customer: "",
  email: "",
  phone: "",
  doctor: "",
  hospital: "",
  issuedDate: "",
  note: "",
  eyes: {
    right: { sphere: "", cylinder: "", axis: "", add: "" },
    left: { sphere: "", cylinder: "", axis: "", add: "" },
  },
};

/* ── prescription row ── */
const RxRow = memo(({ rx, onView }) => {
  const cfg = STATUS_CONFIG[rx.status] || STATUS_CONFIG.pending;
  return (
    <tr className="hover:bg-gray-50/60">
      {/* ID */}
      <td className="px-6 py-4">
        <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
          {rx.id}
        </span>
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={rx.avatar}
            alt={rx.customer}
            className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">
              {rx.customer}
            </p>
            <p className="text-xs text-gray-400 truncate">{rx.email}</p>
          </div>
        </div>
      </td>

      {/* Source */}
      <td className="px-6 py-4">
        {rx.source === "online" ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <FiWifi size={11} /> Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
            <FiWifiOff size={11} /> Offline
          </span>
        )}
      </td>

      {/* Doctor */}
      <td className="px-6 py-4">
        <p className="text-sm text-gray-700 truncate max-w-[160px]">
          {rx.doctor}
        </p>
        <p className="text-xs text-gray-400 truncate max-w-[160px]">
          {rx.hospital}
        </p>
      </td>

      {/* Date */}
      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
        {rx.submittedAt}
      </td>

      {/* Status */}
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}
        >
          {cfg.icon} {cfg.label}
        </span>
      </td>

      {/* Action */}
      <td className="px-6 py-4">
        <div className="flex justify-end">
          <div className="relative group">
            <button
              onClick={() => onView(rx)}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <FiEye size={16} />
            </button>
            <span className="pointer-events-none absolute bottom-full mb-2 right-0 px-2 py-1 text-xs rounded-md bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
              View & Approve
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
});
RxRow.displayName = "RxRow";

/* ── eye chart row ── */
function EyeRow({ label, data }) {
  return (
    <tr>
      <td className="py-2.5 pr-4 font-semibold text-xs text-gray-500 uppercase">
        {label}
      </td>
      <td className="py-2.5 px-3 text-center text-sm font-mono text-gray-800">
        {data.sphere != null
          ? data.sphere > 0
            ? `+${data.sphere}`
            : data.sphere
          : "—"}
      </td>
      <td className="py-2.5 px-3 text-center text-sm font-mono text-gray-800">
        {data.cylinder != null
          ? data.cylinder > 0
            ? `+${data.cylinder}`
            : data.cylinder
          : "—"}
      </td>
      <td className="py-2.5 px-3 text-center text-sm font-mono text-gray-800">
        {data.axis != null ? `${data.axis}°` : "—"}
      </td>
      <td className="py-2.5 px-3 text-center text-sm font-mono text-gray-800">
        {data.add != null ? (data.add > 0 ? `+${data.add}` : data.add) : "—"}
      </td>
    </tr>
  );
}

/* ── detail modal ── */
function DetailModal({ rx, onClose, onApprove, onDecline }) {
  const [reviewNote, setReviewNote] = useState(rx.reviewNote || "");
  const cfg = STATUS_CONFIG[rx.status] || STATUS_CONFIG.pending;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <FiFileText size={17} className="text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-800">
                    Prescription {rx.id}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted at {rx.submittedAt}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Customer + Doctor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiUser size={11} /> Customer
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={rx.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {rx.customer}
                    </p>
                    <p className="text-xs text-gray-400">{rx.email}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{rx.phone}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Prescription Info
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {rx.doctor}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{rx.hospital}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Issued Date:{" "}
                  <span className="text-gray-600">{rx.issuedDate}</span>
                </p>
                <div className="mt-2">
                  {rx.source === "online" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <FiWifi size={10} /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      <FiWifiOff size={10} /> Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Prescription image */}
            {rx.imgUrl && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Prescription Image
                </p>
                <img
                  src={rx.imgUrl}
                  alt="prescription"
                  className="w-full rounded-xl border border-gray-200 object-cover max-h-48"
                />
              </div>
            )}

            {/* Eye chart */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Lens Values
              </p>
              <div className="bg-gray-50 rounded-xl overflow-hidden mt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2.5 pl-4 text-left text-xs text-gray-400 font-semibold uppercase">
                        Eye
                      </th>
                      {["Sph (D)", "Cyl (D)", "Axis", "Add"].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 px-3 text-center text-xs text-gray-400 font-semibold uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <EyeRow label="OD (Right)" data={rx.eyes.right} />
                    <EyeRow label="OS (Left)" data={rx.eyes.left} />
                  </tbody>
                </table>
              </div>


            </div>

            {/* Note */}
            {rx.note && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <FiAlertCircle
                  size={14}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-amber-700">{rx.note}</p>
              </div>
            )}

            {/* Review note */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Admin Note
              </label>
              {rx.status !== "pending" ? (
                <div className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-200 min-h-[60px]">
                  {rx.reviewNote || (
                    <span className="text-gray-300 italic">
                      No notes
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Enter note for approval or decline..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-gray-50 focus:bg-white transition-shadow"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors"
            >
              Close
            </button>

            {(rx.status === "pending" || !rx.status) && (
              <div className="flex gap-2">
                <button
                  onClick={() => onDecline(rx.id, reviewNote, rx)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  <FiX size={14} /> Decline
                </button>
                <button
                  onClick={() => onApprove(rx.id, reviewNote, rx)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <FiCheck size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── add offline modal ── */
function AddOfflineModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_RX);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleEye = (side, field, value) => {
    setForm((f) => ({
      ...f,
      eyes: { ...f.eyes, [side]: { ...f.eyes[side], [field]: value } },
    }));
  };

  const handleSubmit = () => {
    if (!form.customer || !form.doctor) return;
    const today = new Date().toLocaleDateString("en-US");
    onAdd({
      id: `RX-${String(Date.now()).slice(-4)}`,
      ...form,
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? "men" : "women"}/${Math.floor(Math.random() * 90)}.jpg`,
      source: "offline",
      status: "pending",
      submittedAt: today,
      imgUrl: "",
      reviewNote: "",
      eyes: {
        right: {
          sphere:
            form.eyes.right.sphere !== ""
              ? parseFloat(form.eyes.right.sphere)
              : null,
          cylinder:
            form.eyes.right.cylinder !== ""
              ? parseFloat(form.eyes.right.cylinder)
              : null,
          axis:
            form.eyes.right.axis !== ""
              ? parseFloat(form.eyes.right.axis)
              : null,
          add:
            form.eyes.right.add !== "" ? parseFloat(form.eyes.right.add) : null,
        },
        left: {
          sphere:
            form.eyes.left.sphere !== ""
              ? parseFloat(form.eyes.left.sphere)
              : null,
          cylinder:
            form.eyes.left.cylinder !== ""
              ? parseFloat(form.eyes.left.cylinder)
              : null,
          axis:
            form.eyes.left.axis !== "" ? parseFloat(form.eyes.left.axis) : null,
          add:
            form.eyes.left.add !== "" ? parseFloat(form.eyes.left.add) : null,
        },
      },

    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <FiUpload size={17} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  Import Offline Rx
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manually enter eye prescription from paper
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Customer info */}
            <FieldGroup
              title="Customer Information"
              icon={<FiUser size={13} className="text-blue-500" />}
            >
              <Field
                label="Full Name *"
                name="customer"
                value={form.customer}
                onChange={handleChange}
                placeholder="John Doe"
              />
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@gmail.com"
              />
              <Field
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="09xx xxx xxx"
              />
            </FieldGroup>

            {/* Doctor info */}
            <FieldGroup
              title="Prescription Info"
              icon={<FiFileText size={13} className="text-blue-500" />}
            >
              <Field
                label="Doctor *"
                name="doctor"
                value={form.doctor}
                onChange={handleChange}
                placeholder="Dr. Smith"
              />
              <Field
                label="Hospital / Clinic"
                name="hospital"
                value={form.hospital}
                onChange={handleChange}
                placeholder="Eye Hospital"
              />
              <Field
                label="Issued Date"
                name="issuedDate"
                value={form.issuedDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
              />
            </FieldGroup>

            {/* Lens values */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  Lens Values
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase text-center">
                  <div className="text-left">Eye</div>
                  <div>Sph</div>
                  <div>Cyl</div>
                  <div>Axis</div>
                  <div>Add</div>
                </div>
                {["right", "left"].map((side) => (
                  <div
                    key={side}
                    className="grid grid-cols-5 gap-2 mb-2 items-center"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {side === "right" ? "Right" : "Left"}
                    </span>
                    {["sphere", "cylinder", "axis", "add"].map((field) => (
                      <input
                        key={field}
                        type="number"
                        step="0.25"
                        value={form.eyes[side][field]}
                        onChange={(e) => handleEye(side, field, e.target.value)}
                        placeholder="—"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    ))}
                  </div>
                ))}

              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Note
              </label>
              <textarea
                name="note"
                rows={2}
                value={form.note}
                onChange={handleChange}
                placeholder="Additional notes about this prescription..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-gray-50 focus:bg-white transition-shadow"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
            <p className="text-xs text-gray-400">* Required fields</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.customer || !form.doctor}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-40 disabled:pointer-events-none"
              >
                <FiPlus size={14} /> Add Rx
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── helpers ── */
function FieldGroup({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
        {label}
      </label>
      <input
        {...props}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition-shadow"
      />
    </div>
  );
}

/* ── MAIN PAGE ── */
function AdminPrescription() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const itemsPerPage = 6;

  /* ── fetch prescriptions from ALL sources ── */
  const fetchPrescriptions = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Lấy prescriptions từ API Prescription (Profile)
      let profileRx = [];
      try {
        const resRx = await getAllPrescriptionsApi();
        profileRx = resRx.data?.data || resRx.data || [];
      } catch (err) {
        console.error("Lỗi tải đơn thuốc profile:", err);
      }

      // 2. Lấy đơn hàng để lọc ra các đơn nhập toa trực tiếp (Order Rx)
      let orderRx = [];
      try {
        const { getAllOrders } = await import("../services/orderService");
        const allOrders = await getAllOrders();
        // Lọc các đơn đang chờ xử lý hoặc đang đóng gói có toa thuốc
        const pendingOrders = allOrders.filter(o => (o.status === "pending" || o.status === "processing") && o.hasPrescription);
        
        pendingOrders.forEach(order => {
          order.orderItems?.forEach((item, idx) => {
            // Chỉ lấy các item có thông tin toa thuốc
            const rx = item.prescription || item;
            const isRxItem = 
              item.itemType === "PRESCRIPTION" || 
              item.isLens || 
              rx.sphLeft != null || 
              rx.sphRight != null;

            if (isRxItem) {
              const realRx = item.prescription || {};
              orderRx.push({
                id: realRx.id ? realRx.id : `order-rx-${order.id}-${idx}`,
                prescriptionId: realRx.id, // Lưu ID thực tế để gọi API
                customerName: order.customer,
                email: order.email,
                userName: order.customer,
                orderCode: order.code,
                orderId: order.id,
                source: "order", 
                status: "pending",
                createdAt: order.createdAt,
                ...realRx,
              });
            }
          });
        });
      } catch (err) {
        console.error("Lỗi trích xuất đơn thuốc từ đơn hàng:", err);
      }

      // 3. Hợp nhất
      const combined = [
        ...profileRx.map(r => ({ ...r, source: r.source || "profile" })),
        ...orderRx
      ];

      // 4. Map API fields to component-expected shape
      const mapped = combined.map((rx) => {
        // Logic mới:
        // true: Đã duyệt
        // false + có ghi chú: Từ chối
        // false + không ghi chú: Chờ duyệt
        let statusValue = "pending";
        if (rx.status === true || String(rx.status).toLowerCase() === 'approved') {
          statusValue = "approved";
        } else if ((rx.status === false || !rx.status) && (rx.adminNote || rx.reviewNote)) {
          statusValue = "declined";
        } else {
          statusValue = "pending";
        }

        return {
          id: rx.id ?? rx.prescriptionId,
          prescriptionId: rx.prescriptionId || rx.id,
          customer: rx.customerName || rx.userName || rx.customer || "N/A",
          email: rx.customerEmail || rx.email || "",
          avatar: rx.avatar || rx.user?.avatar || `https://ui-avatars.com/api/?name=${rx.customerName || rx.userName || "P"}&background=6366f1&color=fff`,
          doctor: rx.doctorName || rx.doctor || "Not updated",
          hospital: rx.hospital || "N/A",
          issuedDate: rx.issuedDate || rx.expirationDate || "N/A",
          submittedAt: rx.submittedAt || rx.createdAt || "N/A",
          status: statusValue,
          source: rx.source || "online",
          orderId: rx.orderId,
          orderCode: rx.orderCode,
          note: rx.note || (rx.orderCode ? `Rx included with order # ${rx.orderCode}` : ""),
          reviewNote: rx.adminNote || rx.reviewNote || "",

          imgUrl: rx.imgUrl || rx.imageUrl || "",
          eyes: rx.eyes || {
            right: { 
              sphere: rx.sphRight, 
              cylinder: rx.cylRight, 
              axis: rx.axisRight, 
              add: rx.addRight 
            },
            left: { 
              sphere: rx.sphLeft, 
              cylinder: rx.cylLeft, 
              axis: rx.axisLeft, 
              add: rx.addLeft 
            },
          },
        };
      });

      // Sắp xếp đơn mới lên đầu
      mapped.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      
      setPrescriptions(mapped);
    } catch (err) {
      console.error("Lỗi tải danh sách đơn thuốc:", err);
      setPrescriptions([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  /* ── filter ── */
  const filtered = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchSearch =
        rx.customer.toLowerCase().includes(search.toLowerCase()) ||
        rx.id.toLowerCase().includes(search.toLowerCase()) ||
        rx.doctor.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || rx.status === statusFilter;
      const matchSource = sourceFilter === "all" || rx.source === sourceFilter;
      return matchSearch && matchStatus && matchSource;
    });
  }, [prescriptions, search, statusFilter, sourceFilter]);

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const safePage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const getPagination = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (safePage > 4) pages.push("...");
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    )
      pages.push(i);
    if (safePage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  /* ── actions ── */
  const handleView = useCallback((rx) => setViewing(rx), []);
  const handleClose = useCallback(() => setViewing(null), []);

  const handleApprove = useCallback(async (id, note, rx) => {
    try {
      // Ưu tiên dùng prescriptionId nếu id là dạng chuỗi 'order-rx-...'
      const targetId = rx?.prescriptionId || id;
      await approvePrescriptionApi(targetId, note);

      // Tự động chuyển trạng thái đơn hàng sang PROCESSING giống như luồng Pre-order
      if (rx?.orderId) {
        try {
          await updateOrderStatus(rx.orderId, "PROCESSING");
          showToast(`Order #${rx.orderCode || rx.orderId} moved to Processing!`);
        } catch (orderErr) {
          console.error("Auto-update status failed:", orderErr);
        }
      }

      setPrescriptions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "approved", reviewNote: note } : item,
        ),
      );
      setViewing((v) =>
        v ? { ...v, status: "approved", reviewNote: note } : null,
      );
      showToast("Prescription approved successfully.");
    } catch (err) {
      console.error("Lỗi duyệt đơn thuốc:", err);
      showToast("Prescription approval failed: " + (err?.response?.data?.message || err.message), "error");
    }
  }, []);

  const handleDecline = useCallback(async (id, note, rx) => {
    try {
      const targetId = rx?.prescriptionId || id;
      await declinePrescriptionApi(targetId, note);
      setPrescriptions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "declined", reviewNote: note } : item,
        ),
      );
      setViewing((v) =>
        v ? { ...v, status: "declined", reviewNote: note } : null,
      );
      showToast("Prescription declined successfully.");
    } catch (err) {
      console.error("Lỗi từ chối đơn thuốc:", err);
      showToast("Prescription decline failed: " + (err?.response?.data?.message || err.message), "error");
    }
  }, []);

  const handleAdd = useCallback(async (rxData) => {
    try {
      const res = await createOfflinePrescriptionApi(rxData);
      // Reload data from API after adding
      fetchPrescriptions();
      showToast("Prescription created successfully.");
    } catch (err) {
      console.error("Lỗi tạo đơn thuốc offline:", err);
      showToast("Prescription creation failed: " + (err?.response?.data?.message || err.message), "error");
    }
  }, [fetchPrescriptions]);

  /* ── stats ── */
  const stats = useMemo(
    () => ({
      total: prescriptions.length,
      pending: prescriptions.filter((r) => r.status === "pending").length,
      approved: prescriptions.filter((r) => r.status === "approved").length,
      declined: prescriptions.filter((r) => r.status === "declined").length,
    }),
    [prescriptions],
  );

  const activeFilters = [
    statusFilter !== "all",
    sourceFilter !== "all",
    search !== "",
  ].filter(Boolean).length;

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-full">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Eye Prescription Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Approve, decline and import customer eye prescriptions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
        >
          <FiUpload size={14} />
          Import Offline Rx
        </button>
      </div>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "All",
            value: stats.total,
            color: "bg-gray-100 text-gray-700",
            key: "all",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "bg-yellow-50 text-yellow-700",
            key: "pending",
          },
          {
            label: "Approved",
            value: stats.approved,
            color: "bg-green-50 text-green-700",
            key: "approved",
          },
          {
            label: "Declined",
            value: stats.declined,
            color: "bg-red-50 text-red-700",
            key: "declined",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setStatusFilter(s.key);
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150
              ${
                statusFilter === s.key
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            <span>{s.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.color}`}
            >
              {s.value}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative w-72">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search prescription, customer, doctor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-gray-400">
              <FiFilter size={13} />
              {activeFilters > 0 && (
                <span className="bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 text-gray-700"
            >
              <option value="all">All Sources</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3.5 font-semibold tracking-wider w-[10%]">
                  Rx Code
                </th>
                <th className="text-left px-6 py-3.5 font-semibold tracking-wider w-[24%]">
                  Customer
                </th>
                <th className="text-left px-6 py-3.5 font-semibold tracking-wider w-[10%]">
                  Source
                </th>
                <th className="text-left px-6 py-3.5 font-semibold tracking-wider w-[22%]">
                  Doctor / Hospital
                </th>
                <th className="text-left px-6 py-3.5 font-semibold tracking-wider w-[12%]">
                  Submitted Date
                </th>
                <th className="text-center px-6 py-3.5 font-semibold tracking-wider w-[12%]">
                  Status
                </th>
                <th className="w-[10%] px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingData ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      <p className="text-sm text-gray-400">
                        Loading prescriptions...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiFileText
                        size={40}
                        strokeWidth={1.2}
                        className="text-gray-200"
                      />
                      <p className="text-sm text-gray-400">
                        No matching prescriptions found
                      </p>
                      {activeFilters > 0 && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setSourceFilter("all");
                          }}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((rx) => (
                  <RxRow key={rx.id} rx={rx} onView={handleView} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {paginated.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {(safePage - 1) * itemsPerPage + 1}–
                {Math.min(safePage * itemsPerPage, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              prescriptions
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 select-none">
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  ←
                </button>
                {getPagination().map((page, i) =>
                  page === "..." ? (
                    <span key={i} className="px-2 text-gray-300 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[34px] px-3 py-1.5 rounded-lg text-sm font-medium
                        ${safePage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {viewing && (
          <DetailModal
            key={viewing.id}
            rx={viewing}
            onClose={handleClose}
            onApprove={handleApprove}
            onDecline={handleDecline}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddOfflineModal
            key="add-offline"
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPrescription;
