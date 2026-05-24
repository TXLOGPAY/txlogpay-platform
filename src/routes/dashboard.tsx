import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { motion } from "motion/react";
import {
  Shield, Network, Wallet, TrendingUp, History, Plus, Inbox, Loader2,
} from "lucide-react";
import { useActiveOperations } from "@/hooks/use-operations";
import { formatCurrency } from "@/lib/formatters";
import type { DBOperation } from "@/services/operations.db";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TXLOGPAY" }] }),
  component: Dashboard,
});

function computeKpis(ops: DBOperation[]) {
  const active = ops.filter((o) => o.status === "ACTIVE");
  const settled = ops.filter((o) => o.status === "SETTLED");
  const totalTransacionado = ops.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const saldoProtegido = active.reduce((s, o) => s + Number(o.amount || 0), 0);
  return {
    totalTransacionado,
    saldoProtegido,
    openCount: active.length,
    settledCount: settled.length,
    totalOps: ops.length,
  };
}

function Dashboard() {
  const { data: ops = [], isLoading, error } = useActiveOperations();
  const k = computeKpis(ops);
  const currency = ops[0]?.currency || "USD";

  const KPIS = [
    { icon: Wallet, label: "Total Transacionado", value: formatCurrency(k.totalTransacionado, currency), chip: `${k.totalOps} operações`, chipClass: "chip-info" },
    { icon: Network, label: "Operações Abertas", value: String(k.openCount), chip: k.openCount > 0 ? "Em monitoramento" : "Nenhuma", chipClass: "chip-info" },
    { icon: TrendingUp, label: "Operações Concluídas", value: String(k.settledCount), chip: "Liquidadas", chipClass: "chip-success" },
    { icon: Shield, label: "Saldo Protegido", value: formatCurrency(k.saldoProtegido, currency), chip: "Garantia ativa", chipClass: "chip-cargo", featured: true },
  ];

  return (
    <AppShell topbar={
      <div className="hidden md:flex gap-6 text-xs font-mono uppercase tracking-widest">
        <span className="text-secondary">Visão Geral</span>
      </div>
    }>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Operacional</h1>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Monitoramento em tempo real das suas garantias e liberações de pagamento.
          </p>
        </div>
        <Link to="/operacoes/conectar" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova Operação
        </Link>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {KPIS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={"card-surface p-6 " + (kpi.featured ? "relative overflow-hidden" : "")}
                style={kpi.featured ? { background: "linear-gradient(135deg, oklch(0.26 0.10 265 / 0.9), oklch(0.28 0.16 320 / 0.7))" } : undefined}
              >
                <div className="flex justify-between items-start">
                  <kpi.icon className="h-5 w-5 text-secondary" />
                  <span className={"chip " + kpi.chipClass + " text-[10px]"}>{kpi.chip}</span>
                </div>
                <div className="mt-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</div>
                <div className="mt-2 text-3xl font-bold text-gradient">{kpi.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid xl:grid-cols-3 gap-5 mt-5">
            <div className="card-surface p-6 xl:col-span-2 min-h-[280px]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-secondary" /> Operações Recentes
                </h2>
                <Link to="/operacoes" className="text-xs font-mono uppercase tracking-widest text-secondary hover:underline">
                  Ver todas
                </Link>
              </div>
              {ops.length === 0 ? (
                <EmptyOps />
              ) : (
                <div className="space-y-3">
                  {ops.slice(0, 5).map((o) => (
                    <Link
                      key={o.id}
                      to="/operacoes/$id"
                      params={{ id: o.id }}
                      className="flex items-center justify-between p-4 rounded-xl glass hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <div className="font-mono text-secondary font-semibold text-sm">#{o.operation_code}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {o.exporter_name || "—"} · {o.beneficiary_country || "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(Number(o.amount), o.currency)}</div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                          {o.status}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card-surface p-6">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-secondary" /> Resumo Financeiro
              </h2>
              <div className="space-y-4 text-sm">
                <Row label="Total transacionado" value={formatCurrency(k.totalTransacionado, currency)} />
                <Row label="Saldo protegido" value={formatCurrency(k.saldoProtegido, currency)} highlight />
                <Row label="Operações abertas" value={String(k.openCount)} />
                <Row label="Operações concluídas" value={String(k.settledCount)} />
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={"font-mono " + (highlight ? "text-secondary font-bold text-base" : "text-foreground font-semibold")}>{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="card-surface p-12 grid place-items-center">
      <Loader2 className="h-6 w-6 text-secondary animate-spin" />
      <p className="mt-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Carregando dados</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="card-surface p-8 text-center">
      <p className="text-sm text-destructive">Erro ao carregar operações</p>
      <p className="text-xs text-muted-foreground mt-1 font-mono">{message}</p>
    </div>
  );
}

function EmptyOps() {
  return (
    <div className="text-center py-10">
      <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center bg-surface-container-low border border-border mb-4">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Nenhuma operação ativa</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
        Crie sua primeira operação internacional para começar a monitorar pagamentos protegidos.
      </p>
      <Link to="/operacoes/conectar" className="btn-primary inline-flex items-center gap-2 mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold">
        <Plus className="h-4 w-4" /> Criar Operação
      </Link>
    </div>
  );
}
