import { Globe } from "lucide-react";

export default function GeneralSettings() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5">
      {/* Header */}

      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-muted-foreground" />

        <h2 className="section-title">
          General Settings
        </h2>
      </div>

      <p className="mt-4 text-sm text-muted-foreground md:text-base">
        Configure basic application
        settings
      </p>

      {/* Form */}

      <div className="mt-6 space-y-5">
        {[
          {
            label: "Company Name",
            value: "FleetTrack Inc.",
          },

          {
            label: "Timezone",
            value:
              "Asia/Kolkata (GMT+5:30)",
          },

          {
            label: "Language",
            value: "English (US)",
          },

          {
            label: "Date Format",
            value:
              "YYYY-MM-DD HH:mm",
          },
        ].map((item) => (
          <div key={item.label}>
            <label className="mb-2 block text-sm font-medium">
              {item.label}
            </label>

            <input
              type="text"
              defaultValue={item.value}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      {/* Toggles */}

      <div className="mt-8 border-t border-border pt-6">
        <div className="space-y-6">
          {[
            {
              title:
                "Auto-refresh Dashboard",

              description:
                "Automatically update data every 30 seconds",
            },

            {
              title:
                "Show Idle Vehicles",

              description:
                "Display idle vehicles on live tracking map",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h4 className="font-medium">
                  {item.title}
                </h4>

                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked="true"
                aria-label={item.title}
                className="flex h-6 w-11 items-center rounded-full bg-primary px-1"
              >
                <div className="ml-auto h-4 w-4 rounded-full bg-primary-foreground" />
              </button>
            </div>
          ))}
        </div>

        <button className="mt-8 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground sm:w-auto">
          Save Changes
        </button>
      </div>
    </div>
  );
}