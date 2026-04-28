import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN" && user.role !== "OPERATIONAL_STAFF") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
