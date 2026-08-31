import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { RevokeRoleButton } from "@/components/admin/revoke-role-button";
import { UserRoleForm } from "@/components/admin/user-role-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listElevatedUsers } from "@/lib/admin/users-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const users = await listElevatedUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Grant a user editor or admin access. Editors can author content, library books, word
          lists, and translations — never settings, Reports, the audit log, or other users&apos;
          roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grant a role</CardTitle>
          <CardDescription>The user must already have a SentenceStep account.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserRoleForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  No editors or admins yet besides your own account.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="text-muted-foreground px-4 py-3">{user.displayName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RevokeRoleButton userId={user.id} email={user.email} />
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
