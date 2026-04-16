import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./shared/common/ScrollToTop.jsx";
import HomePage from "./store/pages/HomePage.jsx";
import LoginPage from "./store/pages/LoginPage.jsx";
import RegisterPage from "./store/pages/RegisterPage.jsx";
import ProductDetailPage from "./store/pages/ProductDetailPage.jsx";
import ShopPage from "./store/pages/ShopPage.jsx";
import AdminOverview from "./admin/pages/AdminOverview.jsx";
import StoreLayout from "./store/layout/StoreLayout";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminProducts from "./admin/pages/AdminProducts.jsx";
import AdminOrders from "./admin/pages/AdminOrder.jsx";
import FrameSelectionPage from "./store/pages/FrameSelectionPage";
import PrescriptionPage from "./store/pages/PrescriptionPage";
import CheckoutPage from "./store/pages/CheckoutPage";
import OrderSuccessPage from "./store/pages/OrderSuccessPage";
import AdminProfile from "./admin/pages/AdminProfile.jsx";
import AdminPrescription from "./admin/pages/AdminPrescription.jsx";
import ContactPage from "./store/pages/ContactPage.jsx";
import ShippingProgressPage from "./store/pages/ShippingProgressPage.jsx";
import OrderFeedbackPage from "./store/pages/OrderFeedbackPage.jsx";
import ReturnFormPage from "./store/pages/ReturnFormPage.jsx";
import OrderHistoryPage from "./store/pages/OrderHistoryPage.jsx";
import AdminPreorder from "./admin/pages/AdminPreorder.jsx";
import PaymentResultPage from "./store/pages/PaymentResultPage.jsx";
import AdminRoute from "./shared/common/guard/AdminRoute.jsx";
import ReturnRequestManagementPage from "./store/pages/ReturnRequestManagementPage.jsx";
import ReturnRequestDetailPage from "./store/pages/ReturnRequestDetailPage.jsx";

function App() {
  return (
    <div>
      <ScrollToTop />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/frames" element={<FrameSelectionPage />} />
          <Route path="/prescription/:id" element={<PrescriptionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route
            path="/shipping-progress/:id"
            element={<ShippingProgressPage />}
          />
          <Route path="/order-feedback" element={<OrderFeedbackPage />} />
          <Route path="/return-request" element={<ReturnFormPage />} />
          <Route path="/my-orders" element={<OrderHistoryPage />} />
          <Route
            path="/my-return-requests/:requestId"
            element={<ReturnRequestDetailPage />}
          />
          <Route path="/payment-result" element={<PaymentResultPage />} />
        </Route>

        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/dashboard" element={<AdminOverview />} />
          <Route path="/dashboard/profile" element={<AdminProfile />} />
          <Route path="/dashboard/products" element={<AdminProducts />} />
          <Route path="/dashboard/orders" element={<AdminOrders />} />
          <Route
            path="/dashboard/prescriptions"
            element={<AdminPrescription />}
          />
          <Route path="/dashboard/preoders" element={<AdminPreorder />} />
          <Route
            path="/dashboard/return-requests"
            element={<ReturnRequestManagementPage />}
          />
          <Route
            path="/dashboard/return-requests/:requestId"
            element={<ReturnRequestDetailPage />}
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
