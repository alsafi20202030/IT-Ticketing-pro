"use client";

import React, { useState } from "react";
import { Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function StaffRolesView() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_staff_roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff-roles");
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
  });

  const roles = data?.roles || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/staff-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "fail");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_staff_roles"] });
      setName("");
      setDescription("");
      setColor("#6366f1");
      setError("");
    },
    onError: (e: any) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/staff-roles?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "fail");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_staff_roles"] });
    },
    onError: (e: any) => alert(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-800" />
          Staff Roles
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-9 rounded-lg border border-slate-200 cursor-pointer"
            />
            <button
              onClick={() => {
                if (!name.trim()) { setError("Name required"); return; }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No roles</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {roles.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color || "#6366f1" }} />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.name}</div>
                    {r.description && <div className="text-[10px] text-slate-400">{r.description}</div>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Delete?")) deleteMutation.mutate(r.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default StaffRolesView;
