import React, { useState } from 'react';
import { StaffUser, Permissions } from '../types';
import { getStaffList, saveStaffList } from '../utils/storage';
import { Users, UserPlus, Shield, Check, X, Lock } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const StaffManagementView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [staffList, setStaffList] = useState<StaffUser[]>(getStaffList());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('Receiving Clerk');
  const [permissions, setPermissions] = useState<Permissions>({
    viewDashboard: true,
    manageProducts: false,
    processReceipts: true,
    processDeliveries: false,
    processTransfers: false,
    processAdjustments: false,
    manageWarehouses: false,
    manageStaff: false
  });

  const handleTogglePerm = (key: keyof Permissions) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.manageStaff && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to manage staff members.');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      onShowToast('error', 'Missing Fields', 'Please complete all staff account fields.');
      return;
    }

    if (staffList.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      onShowToast('error', 'Email Exists', 'A staff member with this email already exists.');
      return;
    }

    const newStaff: StaffUser = {
      id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: name.trim(),
      email: email.trim(),
      password,
      roleTitle: roleTitle.trim(),
      isSuperAdmin: false,
      permissions,
      createdAt: new Date().toISOString()
    };

    const updated = [...staffList, newStaff];
    saveStaffList(updated);
    setStaffList(updated);
    setIsModalOpen(false);

    // Reset form
    setName('');
    setEmail('');
    setPassword('');
    onShowToast('success', 'Staff Member Added', `${newStaff.name} created with role "${newStaff.roleTitle}".`);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!currentUser.permissions.manageStaff && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to delete staff.');
      return;
    }

    if (staffList.length <= 1) {
      onShowToast('error', 'Action Blocked', 'You must maintain at least one staff member / admin.');
      return;
    }

    const updated = staffList.filter(s => s.id !== staffId);
    saveStaffList(updated);
    setStaffList(updated);
    onShowToast('success', 'Staff Removed', 'Staff account deleted successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Granular Access Control (RBAC)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage staff permissions, roles, and enterprise security privileges</p>
        </div>
        {(currentUser.permissions.manageStaff || currentUser.isSuperAdmin) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Staff Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="p-4 pl-6">Staff Name & Email</th>
                <th className="p-4">Role Title</th>
                <th className="p-4">Permissions Overview</th>
                <th className="p-4 text-center">Super Admin</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-slate-900">
                    <div>{staff.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{staff.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg font-semibold border border-blue-200">
                      {staff.roleTitle}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {Object.entries(staff.permissions).map(([key, allowed]) => {
                        if (!allowed) return null;
                        const labels: Record<string, string> = {
                          viewDashboard: 'Dashboard',
                          manageProducts: 'Products',
                          processReceipts: 'Receipts',
                          processDeliveries: 'Deliveries',
                          processTransfers: 'Transfers',
                          processAdjustments: 'Adjustments',
                          manageWarehouses: 'Warehouses',
                          manageStaff: 'Staff'
                        };
                        return (
                          <span key={key} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                            {labels[key] || key}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {staff.isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] border border-amber-200">
                        <Shield className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Standard</span>
                    )}
                  </td>
                  <td className="p-4 text-right pr-6 whitespace-nowrap">
                    {!staff.isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <UserPlus className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Add Staff & RBAC Privileges</h2>
                  <p className="text-blue-100 text-xs mt-0.5">Assign granular module permissions and login credentials</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Receiving Clerk"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Granular Permissions & Module Access</label>
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {Object.entries(permissions).map(([key, allowed]) => {
                    const labels: Record<string, string> = {
                      viewDashboard: 'View Dashboard & KPIs',
                      manageProducts: 'Manage Products (CRUD)',
                      processReceipts: 'Process Vendor Receipts',
                      processDeliveries: 'Process Deliveries',
                      processTransfers: 'Internal Transfers',
                      processAdjustments: 'Stock Adjustments',
                      manageWarehouses: 'Manage Warehouses',
                      manageStaff: 'Manage Staff & RBAC'
                    };
                    return (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={allowed}
                          onChange={() => handleTogglePerm(key as keyof Permissions)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        {labels[key] || key}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 text-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
