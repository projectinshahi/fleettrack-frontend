"use client";

import { useState } from "react";

import GeneralSettings from "@/components/settings/general-settings";
import IntegrationSettings from "@/components/settings/integration-settings";
import NotificationSettings from "@/components/settings/notification-settings";
import SecuritySettings from "@/components/settings/security-settings";
import SettingsTabs from "@/components/settings/settings-tabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState("General");

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="page-title">
          Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Manage platform settings and
          preferences
        </p>
      </div>

      {/* Tabs */}

      <SettingsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Content */}

      {activeTab === "General" && (
        <GeneralSettings />
      )}

      {activeTab ===
        "Notifications" && (
        <NotificationSettings />
      )}

      {activeTab === "Security" && (
        <SecuritySettings />
      )}

      {activeTab ===
        "Integration" && (
        <IntegrationSettings />
      )}
    </div>
  );
}