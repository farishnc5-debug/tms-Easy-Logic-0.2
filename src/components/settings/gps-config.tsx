"use client";

import { useState } from "react";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";

export default function GPSConfig() {
  const [serverUrl, setServerUrl] = useState(process.env.NEXT_PUBLIC_GPS_SERVER || "https://tracmap3.com");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function testConnection() {
    setStatus("testing");
    setMessage("Testing GPS connection...");

    try {
      // Simulated test — in production, call a verify endpoint
      const response = await fetch("/api/gps/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl, username, password }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Connected to GPS tracking server successfully!");
      } else {
        setStatus("error");
        setMessage("Failed to connect. Check credentials and server URL.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(`Error: ${String(err)}`);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-6">
      <div className="mb-6 flex items-center gap-2">
        <MapPin size={20} className="text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">GPS Tracking Setup</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            GPS Server URL
          </label>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://tracmap3.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            Your Tracking Maps server URL (e.g., tracmap3.com for Server 3)
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Username / Account
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your Tracking Maps account"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            Stored securely. Never shared or logged.
          </p>
        </div>

        {status !== "idle" && (
          <div
            className={`rounded-lg p-3 flex items-center gap-2 text-sm ${
              status === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : status === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-brand-50 text-brand-700 border border-brand-200"
            }`}
          >
            {status === "success" && <CheckCircle size={18} />}
            {status === "error" && <AlertCircle size={18} />}
            {status === "testing" && <div className="animate-spin text-brand-600">⟳</div>}
            <span>{message}</span>
          </div>
        )}

        <button
          onClick={testConnection}
          disabled={!serverUrl || !username || !password || status === "testing"}
          className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {status === "testing" ? "Testing Connection..." : "Test GPS Connection"}
        </button>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-2 font-medium">How to set up GPS tracking:</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Log in to your Tracking Maps account at {serverUrl}</li>
            <li>Go to Devices → Link each vehicle to a GPS device</li>
            <li>Enter your account credentials above</li>
            <li>Click "Test GPS Connection"</li>
            <li>Vehicle locations will update every 30 seconds on the Live Map</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
