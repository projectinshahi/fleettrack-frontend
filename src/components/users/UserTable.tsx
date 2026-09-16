"use client";

import { User } from "@/components/users/TypeUser";

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserTable({
  users,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Role
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {user.name}
                  </td>

                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.email}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`
                        inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide
                        ${
                          user.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(
                      user.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-4">
                      <button
                        onClick={() => onEdit(user)}
                        className="
                          text-sm font-medium text-primary
                          hover:underline
                        "
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(user)}
                        className="
                          text-sm font-medium text-destructive
                          hover:underline
                        "
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}