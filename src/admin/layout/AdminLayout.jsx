import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopHeader from "../components/AdminTopHeader";
import "../styles/admin-font.css";

function AdminLayout() {
  // ✅ Mặc định thu nhỏ
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    document.body.classList.add("admin");
    return () => document.body.classList.remove("admin");
  }, []);

  return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <AdminSidebar collapsed={collapsed} />

        {/* Right side */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopHeader
            collapsed={collapsed}
            onToggleSidebar={
              () => setCollapsed((prev) => !prev) // ✅ toggle chuẩn
            }
          />

          <div className="flex-1 overflow-y-auto bg-gray-100">
            <Outlet />
          </div>
        </div>
      </div>
  );
}

export default AdminLayout;
