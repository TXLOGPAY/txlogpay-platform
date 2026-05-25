import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings, Bell, Shield, Globe, Key } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — TXLOGPAY" }] }),
  component: Configuracoes, 
});

function Configuracoes() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Settings className="h-7 w-7 text-secondary" />Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie preferências da conta corporativa, integrações e segurança.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {[
          { i: Bell, t: "Notificações", s: "Configure alertas operacionais por canal." },
          { i: Shield, t: "Segurança & 2FA", s: "Tokens, biometria e auditoria de acesso." },
          { i: Globe, t: "Integrações Siscomex", s: "Conexões API com a Receita Federal." },
          { i: Key, t: "Chaves API & Webhooks", s: "Conecte seus sistemas operacionais." },
        ].map(c => (
          <div key={c.t} className="card-surface card-surface-hover p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl grid place-items-center" style={{ background: "var(--gradient-brand-soft)" }}><c.i className="h-5 w-5 text-secondary" /></div>
            <div><div className="font-semibold">{c.t}</div><div className="text-xs text-muted-foreground mt-1">{c.s}</div></div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
