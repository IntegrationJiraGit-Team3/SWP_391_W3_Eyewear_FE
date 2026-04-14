import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
function StoreLayout() {
  return (
    <div className="pt-20">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default StoreLayout;
