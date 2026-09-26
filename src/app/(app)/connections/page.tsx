import { Mail, MessageCircle, Send, Bot, Webhook } from "lucide-react";
import { getAllIntegrations, saveGmailConfig, saveWhatsAppConfig, saveTelegramConfig, disconnectIntegration, sendGmailTest, sendWhatsAppTest, sendTelegramTest } from "@/lib/actions/integrations";
import { listApiKeys } from "@/lib/actions/api-keys";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import IntegrationCard from "@/components/connections/integration-card";
import ZatcaConnectCard from "@/components/connections/zatca-connect-card";
import { zatcaStatus } from "@/lib/zatca/service";
import ApiKeysManager from "@/components/connections/api-keys-manager";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!can(me.role, "admin")) redirect("/dashboard");
  const [integrations, apiKeys, zatca] = await Promise.all([getAllIntegrations(), listApiKeys(), zatcaStatus()]);
  const byType = new Map(integrations.map((i) => [i.type, i]));
  const gmail = byType.get("GMAIL")!;
  const whatsapp = byType.get("WHATSAPP")!;
  const telegram = byType.get("TELEGRAM")!;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <Webhook size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Connections — Ecosystem & API / MCP</h2>
          <span dir="rtl" className="ms-auto text-sm font-semibold text-slate-700">
            الاتصالات والتكامل
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Connect Easy Logic to the messaging apps your team already uses, and manage the API keys
          that external systems — including the upcoming <strong>Agent TMS</strong> — will use to
          talk to this app.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
          MESSAGING & EMAIL INTEGRATIONS
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IntegrationCard
            icon={<Mail size={18} className="shrink-0" style={{ color: "#ea4335" }} />}
            iconColor="#ea4335"
            title="Gmail"
            description="Send notifications and documents by email via SMTP."
            integration={gmail}
            saveAction={saveGmailConfig}
            testAction={sendGmailTest}
            disconnectAction={disconnectIntegration.bind(null, "GMAIL")}
            fields={[
              { name: "email", label: "Gmail address", type: "email", placeholder: "ops@yourcompany.com", required: true },
              {
                name: "appPassword",
                label: "App Password (not your normal password)",
                type: "password",
                placeholder: "16-character App Password",
                required: true,
              },
              { name: "fromName", label: "Sender name (optional)", placeholder: "e.g. Easy Logic Operations" },
            ]}
          />
          <IntegrationCard
            icon={<MessageCircle size={18} className="shrink-0" style={{ color: "#25d366" }} />}
            iconColor="#25d366"
            title="WhatsApp"
            description="Send trip/delivery updates via the WhatsApp Cloud API."
            integration={whatsapp}
            saveAction={saveWhatsAppConfig}
            testAction={sendWhatsAppTest}
            disconnectAction={disconnectIntegration.bind(null, "WHATSAPP")}
            fields={[
              { name: "phoneNumberId", label: "Phone Number ID", placeholder: "From Meta developer console", required: true },
              { name: "accessToken", label: "Access Token", type: "password", placeholder: "Permanent or temporary token", required: true },
              { name: "testRecipient", label: "Test recipient number (with country code)", placeholder: "+9665xxxxxxxx" },
              {
                name: "appSecret",
                label: "Meta App Secret (verifies incoming replies are really from Meta)",
                type: "password",
                placeholder: "From Meta app → Settings → Basic",
              },
              {
                name: "webhookVerifyToken",
                label: "Webhook verify token (your choice — also enter it in Meta's dashboard)",
                placeholder: "e.g. a random string you make up",
              },
            ]}
          />
          <IntegrationCard
            icon={<Send size={18} className="shrink-0" style={{ color: "#26a5e4" }} />}
            iconColor="#26a5e4"
            title="Telegram"
            description="Send alerts to a Telegram chat or group via a bot."
            integration={telegram}
            saveAction={saveTelegramConfig}
            testAction={sendTelegramTest}
            disconnectAction={disconnectIntegration.bind(null, "TELEGRAM")}
            fields={[
              { name: "botToken", label: "Bot Token", type: "password", placeholder: "From @BotFather", required: true },
              { name: "chatId", label: "Chat ID", placeholder: "e.g. -100123456789 or your user ID", required: true },
            ]}
          />
          <ZatcaConnectCard
            onboarded={zatca.onboarded}
            environment={zatca.environment}
            onboardedAt={zatca.onboardedAt}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Credentials are stored in your app database, not shared with Anthropic or any third party.
          Treat access to your hosting/database the same as you would any other password store.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          To receive WhatsApp replies (driver/customer messages), add this Webhook URL in Meta&apos;s
          WhatsApp Cloud API dashboard:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
            https://your-live-domain.com/api/webhooks/whatsapp
          </code>{" "}
          — it must be a real public HTTPS domain, so this only works once the app is deployed
          (not on localhost).
        </p>
      </div>

      <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-5">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-brand-700" />
          <p className="text-sm font-semibold text-brand-900">Foundation for Agent TMS (agentic AI)</p>
        </div>
        <p className="mt-1.5 text-sm text-brand-800">
          Agent TMS — an agentic AI that will operate this system on your behalf — is planned for a
          later release. The pieces below are being built now so it has a secure, working foundation
          to connect to when it launches:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-brand-800">
          <li>
            • A live, key-authenticated REST API is already working —{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs text-brand-900">GET /api/v1/shipments</code>{" "}
            with <code className="rounded bg-white px-1.5 py-0.5 text-xs text-brand-900">Authorization: Bearer &lt;key&gt;</code>.
            Generate a key below and try it with curl.
          </li>
          <li>
            • An MCP (Model Context Protocol) server is a thin wrapper around exactly this kind of
            API — once the Agent TMS project starts, it will be added on top of these same keys and
            endpoints rather than a separate system.
          </li>
          <li>
            • The Gmail / WhatsApp / Telegram connections above are what the agent will use to act —
            e.g. notifying a customer or driver — once it&apos;s built.
          </li>
        </ul>
      </div>

      <ApiKeysManager keys={apiKeys} />
    </div>
  );
}
