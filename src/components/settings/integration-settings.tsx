import { Plug } from "lucide-react";

export default function IntegrationSettings() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5">
      <div className="flex items-center gap-3">
        <Plug className="h-5 w-5 text-muted-foreground" />

        <h2 className="section-title">
          Integration Settings
        </h2>
      </div>

      <p className="mt-4 text-sm text-muted-foreground md:text-base">
        Configure third-party
        integrations and APIs
      </p>

      <div className="mt-8 space-y-5">
        {[
          {
            label:
              "Google Maps API Key",

            value:
              "AIzaSy***************",
          },

          {
            label: "Twilio API Key",

            value:
              "TWILIO_***************",
          },

          {
            label:
              "Webhook Endpoint",

            value:
              "https://fleettrack.app/webhooks",
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

        <button className="mt-4 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground sm:w-auto">
          Save Integrations
        </button>
      </div>
    </div>
  );
}