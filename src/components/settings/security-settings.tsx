import { Shield } from "lucide-react";

export default function SecuritySettings() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-muted-foreground" />

        <h2 className="section-title">
          Security Settings
        </h2>
      </div>

      <p className="mt-4 text-sm text-muted-foreground md:text-base">
        Manage authentication and
        account security
      </p>

      <div className="mt-8 space-y-5">
        {[
          "Current Password",
          "New Password",
          "Confirm Password",
        ].map((item) => (
          <div key={item}>
            <label className="mb-2 block text-sm font-medium">
              {item}
            </label>

            <input
              type="password"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ))}

        <button className="mt-4 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground sm:w-auto">
          Update Password
        </button>
      </div>
    </div>
  );
}