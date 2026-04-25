import AdminReportsDashboard from "./AdminReportsDashboard";

function AdminCustomerReport() {
  // This component is a wrapper around AdminReportsDashboard to specify the type of report
  return <AdminReportsDashboard type="customers" />;
}

export default AdminCustomerReport;
