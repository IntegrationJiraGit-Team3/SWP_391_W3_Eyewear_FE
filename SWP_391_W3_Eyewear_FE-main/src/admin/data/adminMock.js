/* ============================
   ADMIN DASHBOARD MOCK DATA
   ============================ */
import { products } from "../../store/data/shopMock";
/* ===== DANH SÁCH SẢN PHẨM ===== */
export const productsMock = products.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  stock: p.stock,
  brand: p.brand,
  sku: `${p.brand}-${p.id}`,
  img: p.images?.[0] || "",
}));

/* ===== DANH SÁCH ĐƠN HÀNG ===== */
export const ordersMock = [
  {
    id: 1,
    code: "ORD-001",
    customer: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    status: "completed",
    createdAt: "02/02/2026",
    items: [{ productId: 2, quantity: 1 }],
    total: 1200000,
  },
  {
    id: 2,
    code: "ORD-002",
    customer: "Trần Thị Bình",
    email: "tranbinh@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    status: "pending",
    createdAt: "03/02/2026",
    items: [
      { productId: 3, quantity: 1 },
      { productId: 12, quantity: 1 },
    ],
    total: 1300000,
  },
  {
    id: 3,
    code: "ORD-003",
    customer: "Lê Minh Cường",
    email: "cuongle@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    status: "cancelled",
    createdAt: "04/02/2026",
    items: [{ productId: 10, quantity: 1 }],
    total: 2100000,
  },
  {
    id: 4,
    code: "ORD-004",
    customer: "Phạm Thu Hà",
    email: "thuhapham@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    status: "completed",
    createdAt: "05/02/2026",
    items: [{ productId: 7, quantity: 1 }],
    total: 890000,
  },
  {
    id: 5,
    code: "ORD-005",
    customer: "Võ Hoàng Nam",
    email: "namvo@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/71.jpg",
    status: "pending",
    createdAt: "06/02/2026",
    items: [{ productId: 6, quantity: 1 }],
    total: 1650000,
  },
  {
    id: 6,
    code: "ORD-006",
    customer: "Ngô Thuỳ Linh",
    email: "linhngo@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    status: "completed",
    createdAt: "07/02/2026",
    items: [{ productId: 9, quantity: 1 }],
    total: 1750000,
  },
  {
    id: 7,
    code: "ORD-007",
    customer: "Đặng Quốc Bảo",
    email: "bao.dang@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    status: "cancelled",
    createdAt: "08/02/2026",
    items: [{ productId: 12, quantity: 1 }],
    total: 550000,
  },
  {
    id: 8,
    code: "ORD-008",
    customer: "Trịnh Mỹ Hạnh",
    email: "hanhtrinh@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/19.jpg",
    status: "completed",
    createdAt: "09/02/2026",
    items: [
      { productId: 4, quantity: 1 },
      { productId: 2, quantity: 1 },
    ],
    total: 2550000,
  },
  {
    id: 9,
    code: "ORD-009",
    customer: "Bùi Thanh Tùng",
    email: "tungbui@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    status: "pending",
    createdAt: "10/02/2026",
    items: [
      { productId: 5, quantity: 1 },
      { productId: 8, quantity: 1 },
    ],
    total: 3300000,
  },
  {
    id: 10,
    code: "ORD-010",
    customer: "Lý Kiều Oanh",
    email: "oanhly@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    status: "completed",
    createdAt: "11/02/2026",
    items: [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 1 },
    ],
    total: 2150000,
  },
  {
    id: 11,
    code: "ORD-011",
    customer: "Hoàng Đức Mạnh",
    email: "manhhoang@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/58.jpg",
    status: "pending",
    createdAt: "15/02/2026",
    items: [{ productId: 11, quantity: 2 }],
    total: 1980000,
  },
  {
    id: 12,
    code: "ORD-012",
    customer: "Vũ Ngọc Ánh",
    email: "anhvu@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    status: "cancelled",
    createdAt: "18/02/2026",
    items: [
      { productId: 6, quantity: 1 },
      { productId: 9, quantity: 1 },
    ],
    total: 3400000,
  },
];

/* ===== ĐƠN THUỐC / TỔA MẮT ===== */
export const prescriptionsMock = [
  {
    id: "RX-001",
    customer: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    phone: "0901234567",
    submittedAt: "20/02/2026",
    source: "online", // online | offline
    status: "pending", // pending | approved | declined
    note: "Khách hàng chụp toa mắt từ bệnh viện Mắt TP.HCM",
    imgUrl: "https://picsum.photos/seed/rx1/600/400",
    doctor: "BS. Nguyễn Thị Lan",
    hospital: "Bệnh viện Mắt TP.HCM",
    issuedDate: "18/02/2026",
    eyes: {
      right: { sphere: -2.25, cylinder: -0.75, axis: 10, add: null },
      left: { sphere: -1.75, cylinder: -0.5, axis: 170, add: null },
    },
    pd: 62,
    reviewNote: "",
  },
  {
    id: "RX-002",
    customer: "Trần Thị Bình",
    email: "tranbinh@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    phone: "0912345678",
    submittedAt: "21/02/2026",
    source: "online",
    status: "approved",
    note: "",
    imgUrl: "https://picsum.photos/seed/rx2/600/400",
    doctor: "BS. Lê Văn Hùng",
    hospital: "Phòng khám Mắt Sáng",
    issuedDate: "19/02/2026",
    eyes: {
      right: { sphere: -3.0, cylinder: -1.25, axis: 5, add: null },
      left: { sphere: -3.5, cylinder: -1.0, axis: 175, add: null },
    },
    pd: 64,
    reviewNote: "Toa hợp lệ, thông tin rõ ràng.",
  },
  {
    id: "RX-003",
    customer: "Lê Minh Cường",
    email: "cuongle@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    phone: "0923456789",
    submittedAt: "21/02/2026",
    source: "offline",
    status: "declined",
    note: "Khách mang toa giấy đến cửa hàng",
    imgUrl: "",
    doctor: "BS. Phạm Minh Tuấn",
    hospital: "Bệnh viện Chợ Rẫy",
    issuedDate: "15/02/2026",
    eyes: {
      right: { sphere: +1.5, cylinder: null, axis: null, add: +2.0 },
      left: { sphere: +1.75, cylinder: null, axis: null, add: +2.0 },
    },
    pd: 66,
    reviewNote: "Toa đã quá 6 tháng, yêu cầu cấp lại.",
  },
  {
    id: "RX-004",
    customer: "Phạm Thu Hà",
    email: "thuhapham@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    phone: "0934567890",
    submittedAt: "22/02/2026",
    source: "online",
    status: "pending",
    note: "",
    imgUrl: "https://picsum.photos/seed/rx4/600/400",
    doctor: "BS. Trần Thị Mai",
    hospital: "BV Mắt Trung Ương",
    issuedDate: "21/02/2026",
    eyes: {
      right: { sphere: -0.75, cylinder: -0.25, axis: 90, add: null },
      left: { sphere: -1.0, cylinder: -0.5, axis: 85, add: null },
    },
    pd: 60,
    reviewNote: "",
  },
  {
    id: "RX-005",
    customer: "Võ Hoàng Nam",
    email: "namvo@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/71.jpg",
    phone: "0945678901",
    submittedAt: "22/02/2026",
    source: "offline",
    status: "approved",
    note: "Nhân viên nhập toa thủ công từ bản giấy",
    imgUrl: "",
    doctor: "BS. Nguyễn Văn Bình",
    hospital: "Phòng khám Mắt Ánh Sáng",
    issuedDate: "20/02/2026",
    eyes: {
      right: { sphere: -4.0, cylinder: -1.5, axis: 15, add: null },
      left: { sphere: -4.25, cylinder: -1.75, axis: 165, add: null },
    },
    pd: 65,
    reviewNote: "Đã xác minh trực tiếp với khách.",
  },
  {
    id: "RX-006",
    customer: "Ngô Thuỳ Linh",
    email: "linhngo@gmail.com",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    phone: "0956789012",
    submittedAt: "23/02/2026",
    source: "online",
    status: "pending",
    note: "",
    imgUrl: "https://picsum.photos/seed/rx6/600/400",
    doctor: "BS. Đỗ Văn Khoa",
    hospital: "Bệnh viện Mắt TP.HCM",
    issuedDate: "22/02/2026",
    eyes: {
      right: { sphere: -5.5, cylinder: -0.75, axis: 180, add: null },
      left: { sphere: -5.0, cylinder: -1.0, axis: 5, add: null },
    },
    pd: 63,
    reviewNote: "",
  },
  {
    id: "RX-007",
    customer: "Đặng Quốc Bảo",
    email: "bao.dang@gmail.com",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    phone: "0967890123",
    submittedAt: "23/02/2026",
    source: "offline",
    status: "pending",
    note: "Khách cao tuổi, nhờ nhân viên nhập hộ",
    imgUrl: "",
    doctor: "BS. Hoàng Thị Yến",
    hospital: "Phòng khám tư Yến Nhi",
    issuedDate: "23/02/2026",
    eyes: {
      right: { sphere: +2.0, cylinder: null, axis: null, add: +2.5 },
      left: { sphere: +2.25, cylinder: null, axis: null, add: +2.5 },
    },
    pd: 68,
    reviewNote: "",
  },
];

/* ===== THỐNG KÊ TỔNG QUAN ===== */
export const dashboardStats = [
  { id: 1, title: "Tổng sản phẩm", value: productsMock.length },
  {
    id: 2,
    title: "Đơn hàng hôm nay",
    value: ordersMock.filter((o) => o.createdAt === "23/02/2026").length,
  },
  { id: 3, title: "Khách hàng", value: 540 },
  {
    id: 4,
    title: "Doanh thu",
    value:
      ordersMock
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.total, 0)
        .toLocaleString("vi-VN") + " ₫",
  },
];

/* ===== OVERVIEW STATS (STAT CARD) ===== */
export const overviewStats = [
  {
    title: "Tổng sản phẩm",
    value: productsMock.length.toString(),
    percent: "+4.2%",
    trend: "up",
    icon: "box",
  },
  {
    title: "Đơn hàng hôm nay",
    value: "32",
    percent: "-1.8%",
    trend: "down",
    icon: "shopping",
  },
  {
    title: "Khách hàng",
    value: "540",
    percent: "+6.1%",
    trend: "up",
    icon: "users",
  },
  {
    title: "Doanh thu",
    value:
      ordersMock
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.total, 0)
        .toLocaleString("vi-VN") + " ₫",
    percent: "+12.5%",
    trend: "up",
    icon: "wallet",
  },
];

/* ===== RECENT ORDERS ===== */
export const recentOrders = ordersMock.slice(0, 5).map((order) => ({
  id: order.code,
  customer: order.customer,
  email: order.email,
  avatar: order.avatar,
  status: order.status,
  total: order.total.toLocaleString("vi-VN") + " ₫",
  createdAt: order.createdAt,
}));

/* ===== ORDER STATUS DONUT ===== */
export const orderStatusData = [
  {
    name: "Hoàn thành",
    value: ordersMock.filter((o) => o.status === "completed").length,
  },
  {
    name: "Chờ xử lý",
    value: ordersMock.filter((o) => o.status === "pending").length,
  },
  {
    name: "Đã huỷ",
    value: ordersMock.filter((o) => o.status === "cancelled").length,
  },
];

/* ===== PRESCRIPTION STATUS ===== */
export const prescriptionStatusData = [
  {
    name: "Chờ duyệt",
    value: prescriptionsMock.filter((r) => r.status === "pending").length,
  },
  {
    name: "Đã duyệt",
    value: prescriptionsMock.filter((r) => r.status === "approved").length,
  },
  {
    name: "Từ chối",
    value: prescriptionsMock.filter((r) => r.status === "declined").length,
  },
];

/* ===== REVENUE CHART ===== */
export const revenueData = [
  { day: "Thứ 2", revenue: 1200000 },
  { day: "Thứ 3", revenue: 2100000 },
  { day: "Thứ 4", revenue: 1800000 },
  { day: "Thứ 5", revenue: 2600000 },
  { day: "Thứ 6", revenue: 3200000 },
  { day: "Thứ 7", revenue: 2800000 },
  { day: "CN", revenue: 3500000 },
];

/* ===== ADMIN PROFILE ===== */
export const adminMock = {
  id: 1,
  name: "Admin not Loggin",
  email: "admin@admin.com",
  password: "123",
  phone: "0123456789",
  role: "Quản trị hệ thống",
  role_EN: "Admin",
  img: "https://www.shutterstock.com/image-photo/create-imageiphone-memoji-avatar-style-600nw-2683889647.jpg",
  address: "this is address fields",
  joinedAt: "12/2022",
  social: {
    github: "https://github.com/mikeyvo",
    facebook: "https://facebook.com/mikeyvo",
    gmail: "mailto:admin@gmail.com",
  },
};


/* ===== PREORDER PIPELINE ===== */
/*
  Steps (in order):
    1. placed       → Đã đặt trước
    2. confirmed    → Xác nhận đơn
    3. prescription → Kiểm tra toa mắt
    4. production   → Đang sản xuất
    5. qc           → Kiểm tra chất lượng
    6. shipping     → Đang giao hàng
    7. delivered    → Đã giao

  cancelledAt: step index where it was cancelled (or null)
*/

const _d = (offset) => {
  const d = new Date("2026-03-01");
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("vi-VN");
};

export const preordersMock = [
  {
    id: "PRE-001",
    customer: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0901234567",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    createdAt: _d(0),
    step: 3,
    cancelled: false,
    deposit: 500000,
    note: "Khách muốn gọng màu đen, tròng chống UV400.",
    items: [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 1 },
    ],
    total: 2150000,
    address: "12 Lê Lợi, Q.1, TP.HCM",
    rxId: "RX-001",
    history: [
      { step: 0, date: _d(0),  note: "Khách đặt đơn trực tuyến." },
      { step: 1, date: _d(1),  note: "Admin xác nhận đơn và liên hệ khách." },
      { step: 2, date: _d(2),  note: "Toa mắt RX-001 được kiểm tra hợp lệ." },
      { step: 3, date: _d(3),  note: "Chuyển sang xưởng sản xuất." },
    ],
  },
  {
    id: "PRE-002",
    customer: "Trần Thị Bình",
    email: "tranbinh@gmail.com",
    phone: "0912345678",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    createdAt: _d(-3),
    step: 5,
    cancelled: false,
    deposit: 300000,
    note: "",
    items: [{ productId: 4, quantity: 1 }],
    total: 1350000,
    address: "45 Nguyễn Trãi, Q.5, TP.HCM",
    rxId: null,
    history: [
      { step: 0, date: _d(-3), note: "Khách đặt đơn." },
      { step: 1, date: _d(-2), note: "Xác nhận." },
      { step: 2, date: _d(-2), note: "Không cần toa mắt (kính mát)." },
      { step: 3, date: _d(-1), note: "Sản xuất hoàn tất." },
      { step: 4, date: _d(-1), note: "QC đạt yêu cầu." },
      { step: 5, date: _d(0),  note: "Đã bàn giao cho đơn vị vận chuyển." },
    ],
  },
  {
    id: "PRE-003",
    customer: "Lê Minh Cường",
    email: "cuongle@gmail.com",
    phone: "0923456789",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    createdAt: _d(-7),
    step: 7,
    cancelled: false,
    deposit: 800000,
    note: "Giao giờ hành chính.",
    items: [{ productId: 6, quantity: 1 }],
    total: 1650000,
    address: "88 Bà Triệu, Hà Nội",
    rxId: "RX-003",
    history: [
      { step: 0, date: _d(-7), note: "Khách đặt đơn." },
      { step: 1, date: _d(-6), note: "Xác nhận." },
      { step: 2, date: _d(-5), note: "Kiểm tra toa." },
      { step: 3, date: _d(-4), note: "Sản xuất." },
      { step: 4, date: _d(-3), note: "QC đạt." },
      { step: 5, date: _d(-2), note: "Giao vận." },
      { step: 6, date: _d(-1), note: "Đã giao thành công." },
    ],
  },
  {
    id: "PRE-004",
    customer: "Phạm Thu Hà",
    email: "thuhapham@gmail.com",
    phone: "0934567890",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    createdAt: _d(-1),
    step: 1,
    cancelled: false,
    deposit: 400000,
    note: "Khách mới lần đầu đặt.",
    items: [{ productId: 3, quantity: 1 }, { productId: 8, quantity: 1 }],
    total: 2200000,
    address: "22 Trần Phú, Đà Nẵng",
    rxId: "RX-004",
    history: [
      { step: 0, date: _d(-1), note: "Khách đặt đơn trực tuyến." },
      { step: 1, date: _d(0),  note: "Admin xác nhận đơn." },
    ],
  },
  {
    id: "PRE-005",
    customer: "Võ Hoàng Nam",
    email: "namvo@gmail.com",
    phone: "0945678901",
    avatar: "https://randomuser.me/api/portraits/men/71.jpg",
    createdAt: _d(-2),
    step: 2,
    cancelled: true,
    deposit: 500000,
    note: "Khách huỷ vì toa không hợp lệ.",
    items: [{ productId: 9, quantity: 1 }],
    total: 1750000,
    address: "5 Phan Đình Phùng, Huế",
    rxId: "RX-003",
    history: [
      { step: 0, date: _d(-2), note: "Khách đặt đơn." },
      { step: 1, date: _d(-1), note: "Xác nhận." },
      { step: 2, date: _d(0),  note: "Toa mắt không hợp lệ — đơn bị huỷ." },
    ],
  },
  {
    id: "PRE-006",
    customer: "Ngô Thuỳ Linh",
    email: "linhngo@gmail.com",
    phone: "0956789012",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    createdAt: _d(0),
    step: 0,
    cancelled: false,
    deposit: 0,
    note: "",
    items: [{ productId: 5, quantity: 1 }],
    total: 1850000,
    address: "77 Điện Biên Phủ, Q.3, TP.HCM",
    rxId: null,
    history: [
      { step: 0, date: _d(0), note: "Khách vừa đặt đơn." },
    ],
  },
];
