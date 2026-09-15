"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import UserTable from "@/components/users/UserTable";
import UserModal from "@/components/users/UserModal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";

import { getUsers, deleteUser } from "@/lib/user-api";
import { User } from "@/components/users/TypeUser";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [deleteUserState, setDeleteUserState] =
    useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(false);

  // Only the first load shows the skeleton; mutations refetch silently in place.
  async function loadUsers(silent = false) {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError(true);
      else toast.error("Failed to refresh users");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(mounted.current);
    mounted.current = true;
  }, []);

  async function handleDeleteConfirm() {
    if (!deleteUserState) return;

    setDeleting(true);
    try {
      await deleteUser(deleteUserState.id);
      toast.success("User deleted successfully");
      setDeleteUserState(null);
      await loadUsers(true);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">
              User Management
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage system users and roles
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedUser(null);
              setModalOpen(true);
            }}
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Add User
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton columns={5} rows={8} />
        ) : error ? (
          <ErrorState
            message="Couldn't load users."
            onRetry={() => loadUsers()}
          />
        ) : (
          <UserTable
            users={users}
            onEdit={(user) => {
              setSelectedUser(user);
              setModalOpen(true);
            }}
            onDelete={(user) => {
              setDeleteUserState(user);
            }}
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={selectedUser}
        onSuccess={() => {
          loadUsers(true);

          if (selectedUser) {
            toast.success("User updated successfully");
          } else {
            toast.success("User created successfully");
          }
        }}
      />

      {/* Delete Modal */}
      <ConfirmDialog
        open={!!deleteUserState}
        title="Delete User?"
        description={
          <>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold text-foreground">
              {deleteUserState?.name ?? "this user"}
            </span>{" "}
            and related data.
          </>
        }
        loading={deleting}
        onClose={() => setDeleteUserState(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
