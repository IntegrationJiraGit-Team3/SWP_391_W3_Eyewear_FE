import { useState } from "react";
import {
  FiEdit,
  FiMail,
  FiPhone,
  FiUser,
  FiShield,
  FiMapPin,
  FiX,
  FiGithub,
  FiFacebook,
  FiGlobe,
  FiCheck,
  FiCamera,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";


function AdminProfile() {
  const stored = localStorage.getItem("currentUser");

  

  const getAdminData = stored
    ? JSON.parse(stored)
    : {
        userId: "",
        name: "",
        email: "",
        phone: "",
        role: "",
        accountStatus: "",
        createdAt: "",
      };

  const [admin, setAdmin] = useState(getAdminData);
  const [draft, setDraft] = useState(getAdminData);
  const [editing, setEditing] = useState(false);

  const handleChange = (e) =>
    setDraft({ ...draft, [e.target.name]: e.target.value });
  const handleSave = () => {
    setAdmin(draft);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft(admin);
    setEditing(false);
  };

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">User Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your account information
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── LEFT: Avatar card ── */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Avatar + name */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Cover gradient */}
            <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-700" />

            <div className="px-6 pb-6 -mt-10">
              <div className="relative w-fit mb-4">
                <img
                  src={`https://ui-avatars.com/api/?name=${admin.name || admin.email}&background=1c1917&color=fff&bold=true`}
                  alt={admin.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
                {/* Online dot */}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                {editing && (
                  <button className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                    <FiCamera size={16} className="text-white" />
                  </button>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {admin.name}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{admin.email}</p>

              {/* Edit / Save / Cancel */}
              <div className="mt-5">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <FiEdit size={14} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiX size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <FiCheck size={14} />
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Stats
            </h3>
            <div className="space-y-4">
              {[
                {
                  icon: <FiCalendar size={15} className="text-purple-500" />,
                  label: "Joined Date",
                  value: admin.createdAt,
                },
                {
                  icon: <FiShield size={15} className="text-green-500" />,
                  label: "Status",
                  value: "Active",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 text-sm text-gray-500">
                    {s.icon}
                    {s.label}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Social links */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Repository
            </h3>
            <div className="space-y-2">
              {[
                {
                  icon: <FiGithub size={15} />,
                  label: "Github - FrontEnd",
                  value: "https://github.com/KhangTDse/SWP_391_Group5_Frontend.git",
                  color: "text-gray-700",
                },
                {
                  icon: <FiGithub size={15} />,
                  label: "Github - Backend",
                  value: "https://github.com/nminhnhanz/SWP302_NHOM5_5.git",
                  color: "text-gray-700",
                }
                
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.value}
                  target = "_blank"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span
                    className={`${s.color} group-hover:scale-110 transition-transform`}
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-sm text-gray-700 truncate">{s.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info sections ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <FiUser size={15} className="text-blue-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProfileField
                icon={<FiUser size={14} />}
                label="Full Name"
                value={admin.name}
                editing={editing}
                name="name"
                draftValue={draft.name}
                onChange={handleChange}
              />
              <ProfileField
                icon={<FiMail size={14} />}
                label="Email"
                value={admin.email}
                editing={editing}
                name="email"
                draftValue={draft.email}
                onChange={handleChange}
              />
              <ProfileField
                icon={<FiPhone size={14} />}
                label="Phone Number"
                value={admin.phone}
                editing={editing}
                name="phone"
                draftValue={draft.phone}
                onChange={handleChange}
              />
              <ProfileField
                icon={<FiMapPin size={14} />}
                label="Address"
                value={admin.address}
                editing={editing}
                name="address"
                draftValue={draft.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* System info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <FiShield size={15} className="text-blue-500" />
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProfileDisplay icon={<FiShield size={14} />} label="Role">
                <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  {admin.role}
                </span>
              </ProfileDisplay>

              <ProfileDisplay label="Account ID">
                <span className="font-mono text-sm text-gray-700">
                  #{admin.userId}
                </span>
              </ProfileDisplay>
              <ProfileDisplay label="Status">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">Active</span>
                </span>
              </ProfileDisplay>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-red-600 mb-1">
              Danger Zone
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              These actions cannot be undone. Please be cautious.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Change Password
              </button>
              <button className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function ProfileField({
  icon,
  label,
  value,
  editing,
  name,
  draftValue,
  onChange,
  textarea,
}) {
  if (!editing) {
    return (
      <ProfileDisplay icon={icon} label={label}>
        {value || (
          <span className="text-gray-300 italic text-xs">Not updated</span>
        )}
      </ProfileDisplay>
    );
  }

  return (
    <div>
      <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1.5">
        {icon} {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          value={draftValue}
          onChange={onChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-gray-50 focus:bg-white transition-shadow"
        />
      ) : (
        <input
          name={name}
          value={draftValue}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-shadow"
        />
      )}
    </div>
  );
}

function ProfileDisplay({ icon, label, children }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
      <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1.5">
        {icon} {label}
      </div>
      <div className="text-sm font-medium text-gray-900 break-words">
        {children}
      </div>
    </div>
  );
}

export default AdminProfile;
