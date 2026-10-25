"use client";

import React, { useState, useEffect } from "react";

export function StaffRolesView() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/staff-roles");
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">إدارة أدوار الموظفين (Staff Roles)</h2>
      {loading ? (
        <p className="text-gray-500">جاري تحميل الأدوار...</p>
      ) : (
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-gray-400">لا توجد أدوار مخصصة حالياً.</p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="p-3 border rounded flex justify-between">
                <span>{role.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default StaffRolesView;