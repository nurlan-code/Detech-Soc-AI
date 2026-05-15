"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/shared/Header";
import { cn } from "@/lib/utils";
import {
  Plug, CheckCircle, XCircle, Plus, X, Link, RefreshCw,
  Zap, Shield, Eye, EyeOff, AlertTriangle, Activity,
} from "lucide-react";
import toast from "react-hot-toast";

type Integration = {
  id: string;
  name: string;
  category: string;
  icon: string;
  connected: boolean;
  description: string;
  lastSync?: string;
  alertsIngested?: number;
};

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "splunk",     name: "Splunk",              category: "SIEM",         icon: "🔍", connected: true,  description: "Real-time security event ingestion", lastSync: "2m ago",  alertsIngested: 12847 },
  { id: "elastic",    name: "Elastic/SIEM",         category: "SIEM",         icon: "⚡", connected: false, description: "Elasticsearch security analytics" },
  { id: "crowdstrike",name: "CrowdStrike Falcon",   category: "EDR",          icon: "🦅", connected: true,  description: "Endpoint detection and response", lastSync: "1m ago",  alertsIngested: 5432 },
  { id: "defender",   name: "Microsoft Defender",   category: "EDR",          icon: "🛡️", connected: false, description: "Microsoft endpoint security" },
  { id: "virustotal", name: "VirusTotal",           category: "Threat Intel", icon: "🔬", connected: true,  description: "IOC reputation and file scanning", lastSync: "5m ago" },
  { id: "shodan",     name: "Shodan",               category: "Threat Intel", icon: "🌐", connected: false, description: "Internet-connected device intel" },
  { id: "misp",       name: "MISP",                 category: "Threat Intel", icon: "🕵️", connected: false, description: "Open-source threat intelligence platform" },
  { id: "pagerduty",  name: "PagerDuty",            category: "Alerting",     icon: "📟", connected: false, description: "Incident alerting and on-call management" },
  { id: "slack",      name: "Slack",                category: "Notification", icon: "💬", connected: true,  description: "SOC team notifications", lastSync: "Just now" },
  { id: "teams",      name: "Microsoft Teams",      category: "Notification", icon: "👥", connected: false, description: "Teams channel notifications" },
  { id: "jira",       name: "Jira",                 category: "Ticketing",    icon: "🎫", connected: false, description: "Incident ticket management" },
  { id: "servicenow", name: "ServiceNow",           category: "Ticketing",    icon: "🔧", connected: false, description: "Enterprise ITSM and ticketing" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "SIEM":         Activity,
  "EDR":          Shield,
  "Threat Intel": Zap,
  "Alerting":     AlertTriangle,
  "Notification": Link,
  "Ticketing":    Plug,
};

type ConnectForm = {
  apiKey: string;
  endpoint: string;
  webhookUrl: string;
};

function ConnectModal({ integration, onClose, onConnect }: {
  integration: Integration;
  onClose: () => void;
  onConnect: (id: string) => void;
}) {
  const [form, setForm] = useState<ConnectForm>({ apiKey: "", endpoint: "", webhookUrl: "" });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  const handleTest = async () => {
    if (!form.apiKey.trim()) { toast.error("API key is required to test"); return; }
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTesting(false);
    setTested(true);
    toast.success(`Connection to ${integration.name} tested successfully`, { icon: "✅" });
  };

  const handleConnect = async () => {
    if (!form.apiKey.trim()) { toast.error("API key is required"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    onConnect(integration.id);
    toast.success(`${integration.name} connected successfully!`, { icon: "🔗", duration: 4000 });
    onClose();
    setLoading(false);
  };

  const needsEndpoint = ["elastic", "misp", "splunk"].includes(integration.id);
  const needsWebhook = ["slack", "teams", "pagerduty"].includes(integration.id);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-soc-border">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-white">Connect {integration.name}</h2>
                <p className="text-xs text-gray-500">Enter your credentials to integrate</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key *</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder="Enter your API key or token"
                  className="soc-input pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Endpoint (if needed) */}
            {needsEndpoint && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">API Endpoint URL</label>
                <input
                  value={form.endpoint}
                  onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
                  placeholder="https://your-instance.example.com/api"
                  className="soc-input font-mono text-xs"
                />
              </div>
            )}

            {/* Webhook (if needed) */}
            {needsWebhook && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Webhook URL</label>
                <input
                  value={form.webhookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                  placeholder="https://hooks.example.com/services/..."
                  className="soc-input font-mono text-xs"
                />
              </div>
            )}

            {/* Demo note */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/8 border border-blue-500/15 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300/70">Demo mode — credentials are not actually stored or used. Any value will work for testing.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-5 border-t border-soc-border">
            <button
              onClick={handleTest}
              disabled={testing || !form.apiKey.trim()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-40",
                tested
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-soc-dark text-gray-400 border-soc-border hover:border-gray-600 hover:text-gray-200"
              )}
            >
              {testing
                ? <><div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" /> Testing...</>
                : tested
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Tested</>
                  : <><Zap className="w-3.5 h-3.5" /> Test</>
              }
            </button>
            <motion.button
              onClick={handleConnect}
              disabled={loading || !form.apiKey.trim()}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Connecting...</>
                : <><Link className="w-4 h-4" /> Connect</>
              }
            </motion.button>
            <button onClick={onClose} className="px-3 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DisconnectConfirm({ integration, onClose, onDisconnect }: {
  integration: Integration;
  onClose: () => void;
  onDisconnect: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    onDisconnect(integration.id);
    toast.success(`${integration.name} disconnected`, { icon: "🔌" });
    onClose();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-sm bg-soc-surface border border-soc-border rounded-2xl shadow-2xl z-10 p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="text-center mb-5">
            <span className="text-4xl block mb-3">{integration.icon}</span>
            <h3 className="text-base font-semibold text-white mb-1">Disconnect {integration.name}?</h3>
            <p className="text-xs text-gray-500">This will stop data ingestion from this integration. You can reconnect at any time.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handle}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </motion.button>
            <button onClick={onClose} className="flex-1 py-2.5 bg-soc-dark border border-soc-border text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [connectTarget, setConnectTarget] = useState<Integration | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const connectedCount = integrations.filter((i) => i.connected).length;

  const handleConnect = (id: string) => {
    setIntegrations((prev) => prev.map((i) =>
      i.id === id ? { ...i, connected: true, lastSync: "Just now" } : i
    ));
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) => prev.map((i) =>
      i.id === id ? { ...i, connected: false, lastSync: undefined, alertsIngested: undefined } : i
    ));
  };

  const handleSync = async (integration: Integration) => {
    setSyncing(integration.id);
    await new Promise((r) => setTimeout(r, 1500));
    setIntegrations((prev) => prev.map((i) =>
      i.id === integration.id ? { ...i, lastSync: "Just now" } : i
    ));
    setSyncing(null);
    toast.success(`${integration.name} synced successfully`, { icon: "🔄" });
  };

  const categories = ["SIEM", "EDR", "Threat Intel", "Alerting", "Notification", "Ticketing"];

  return (
    <div className="flex flex-col h-full bg-soc-dark">
      <Header title="Integrations" />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Stats */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          {[
            { label: "Connected",    value: connectedCount,                    color: "text-green-400",  border: "border-l-green-500" },
            { label: "Available",    value: integrations.length - connectedCount, color: "text-gray-400", border: "border-l-gray-500" },
            { label: "Categories",   value: categories.length,                 color: "text-blue-400",   border: "border-l-blue-500" },
            { label: "Data Sources", value: connectedCount,                    color: "text-purple-400", border: "border-l-purple-500" },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={cn("soc-card p-4 border-l-2", border)}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">{connectedCount} of {integrations.length} connected</span>
          </div>
          <motion.button
            onClick={() => toast("Contact your admin to add custom integrations", { icon: "ℹ️" })}
            className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600/15 hover:bg-yellow-600/25 text-yellow-400 text-xs font-semibold rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-3.5 h-3.5" /> Request Integration
          </motion.button>
        </motion.div>

        {/* Integration categories */}
        {categories.map((category, ci) => {
          const items = integrations.filter((i) => i.category === category);
          if (items.length === 0) return null;
          const CatIcon = CATEGORY_ICONS[category] ?? Plug;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + ci * 0.08 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CatIcon className="w-3.5 h-3.5 text-gray-500" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</h3>
                <div className="flex-1 h-px bg-soc-border" />
                <span className="text-[10px] text-gray-600">{items.filter((i) => i.connected).length}/{items.length} connected</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((integration) => (
                  <motion.div
                    key={integration.id}
                    className={cn(
                      "soc-card p-4 transition-all hover:border-gray-600",
                      integration.connected && "border-green-500/20 bg-green-500/3"
                    )}
                    whileHover={{ y: -1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      {integration.connected
                        ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      }
                    </div>

                    {/* Connected stats */}
                    {integration.connected && (
                      <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-600">
                        {integration.lastSync && (
                          <span className="flex items-center gap-1">
                            <motion.div
                              className="w-1.5 h-1.5 bg-green-500 rounded-full"
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            Last sync: {integration.lastSync}
                          </span>
                        )}
                        {integration.alertsIngested && (
                          <span>{integration.alertsIngested.toLocaleString()} events</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {integration.connected ? (
                        <>
                          <button
                            onClick={() => handleSync(integration)}
                            disabled={syncing === integration.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-soc-dark hover:bg-white/5 text-gray-400 hover:text-gray-200 text-xs rounded-lg border border-soc-border hover:border-gray-600 transition-all disabled:opacity-40"
                          >
                            <RefreshCw className={cn("w-3 h-3", syncing === integration.id && "animate-spin")} />
                            {syncing === integration.id ? "Syncing..." : "Sync"}
                          </button>
                          <button
                            onClick={() => setDisconnectTarget(integration)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs rounded-lg border border-red-500/15 hover:border-red-500/30 transition-all ml-auto"
                          >
                            <XCircle className="w-3 h-3" />
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <motion.button
                          onClick={() => setConnectTarget(integration)}
                          className="flex items-center gap-1.5 px-3 py-1.5 w-full justify-center bg-green-500/8 hover:bg-green-500/15 text-green-400 text-xs font-medium rounded-lg border border-green-500/15 hover:border-green-500/30 transition-all"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link className="w-3 h-3" /> Connect
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {connectTarget && (
          <ConnectModal
            integration={connectTarget}
            onClose={() => setConnectTarget(null)}
            onConnect={handleConnect}
          />
        )}
        {disconnectTarget && (
          <DisconnectConfirm
            integration={disconnectTarget}
            onClose={() => setDisconnectTarget(null)}
            onDisconnect={handleDisconnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
