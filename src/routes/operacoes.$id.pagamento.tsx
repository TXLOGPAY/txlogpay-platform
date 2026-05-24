import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Clock, Upload, CheckCircle2, ShieldCheck, Loader2, AlertTriangle, ClipboardCopy } from "lucide-react";
import { useOperation, useMarkOperationActive } from "@/hooks/use-operations";
import { operationsDb } from "@/services/operations.db";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";

export const Route = createFileRoute("/operacoes/$id/pagamento")({
  head: ({ params }) => ({ meta: [{ title: `Aguardando pagamento ${params.id} — TXLOGPAY` }] }),
  component: AwaitPayment,
});

function AwaitPayment() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: op, isLoading, error } = useOperation(id);
  const markActive = useMarkOperationActive();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(op?.payment_proof_url ?? null);

  if (isLoading) {
    return <AppShell><div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 text-secondary animate-spin" /></div></AppShell>;
  }
  if (error || !op) {
    return <AppShell><div className="card-surface p-10 text-center"><p className="text-destructive">Operação não encontrada</p></div></AppShell>;
  }
  if (op.status === "ACTIVE" || op.status === "SETTLED") {
    // already validated — go to detail
    navigate({ to: "/operacoes/$id", params: { id }, replace: true });
    return null;
  }

  async function handleUpload() {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const path = await operationsDb.uploadProof(user.id, id, file);
      await operationsDb.update(id, { payment_proof_url: path });
      setUploadedPath(path);
      qc.invalidateQueries({ queryKey: ["operations", "detail", id] });
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar comprovante: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleValidate() {
    await markActive.mutateAsync(id);
    navigate({ to: "/operacoes/$id", params: { id } });
  }

  return (
    <AppShell>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
        <Link to="/operacoes" className="hover:text-foreground">Operações</Link> ›{" "}
        <span className="text-secondary">Aguardando pagamento</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-7 w-7 text-warning" />
            Aguardando confirmação do pagamento
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Sua operação <span className="font-mono text-secondary">#{op.operation_code}</span> está registrada como
            rascunho operacional. Após a confirmação do pagamento, ela passa para o status ATIVA e entra no monitoramento.
          </p>
        </div>
        <span className="chip chip-warning text-[11px]">
          <span className="pulse-dot before:inline-block before:mr-1.5" /> PENDING_PAYMENT
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Breakdown */}
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
              <ShieldCheck className="h-4 w-4 text-secondary" /> Resumo Financeiro
            </h2>
            <div className="space-y-3 p-4 rounded-xl glass">
              <Row label="Valor protegido" value={formatCurrency(Number(op.amount), op.currency)} />
              <Row label="Taxa TXLOGPAY" value={formatCurrency(Number(op.fee_amount), op.currency)} />
              <div className="h-px bg-border my-1" />
              <Row label="Total a pagar" value={formatCurrency(Number(op.total_amount), op.currency)} highlight />
            </div>
          </div>

          {/* Instructions */}
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold mb-4">Instruções de Pagamento</h2>
            <div className="space-y-3 text-sm">
              <KV k="Banco" v="Standard Chartered (Global)" />
              <KV k="SWIFT / BIC" v="TXLPBRSPXXX" copy />
              <KV k="Conta operacional" v="8829-00129-2192-0" copy />
              <KV k="Referência" v={op.operation_code} copy />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30 text-xs text-muted-foreground flex gap-2">
              <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>Após realizar o pagamento, anexe o comprovante abaixo. A operação só será ativada após validação.</span>
            </div>
          </div>

          {/* Upload */}
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Upload className="h-4 w-4 text-secondary" /> Comprovante de Pagamento
            </h2>

            {uploadedPath ? (
              <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Comprovante enviado</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{uploadedPath.split("/").pop()}</div>
                </div>
                <button onClick={() => { setUploadedPath(null); setFile(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Substituir
                </button>
              </div>
            ) : (
              <>
                <label className="block rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-secondary/50 hover:bg-surface-container transition-all">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm">{file ? file.name : "Clique para selecionar (PDF, JPG, PNG)"}</div>
                  {file && <div className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</div>}
                </label>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn-primary mt-4 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4" /> Enviar comprovante</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Admin / Hackathon sidebar */}
        <div className="space-y-5">
          <div className="card-surface p-6 ring-1 ring-accent/40">
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">
              ⚡ Hackathon · Admin temporário
            </div>
            <h3 className="font-semibold mb-2">Validação Manual</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Botão temporário para simular validação do comprovante pela equipe de compliance. Em produção, isso será automático via reconciliação bancária.
            </p>
            <button
              onClick={handleValidate}
              disabled={markActive.isPending}
              className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-accent)" }}
            >
              {markActive.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</> : <><CheckCircle2 className="h-4 w-4" /> Pagamento Validado</>}
            </button>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Ao clicar, o status muda para ACTIVE e a operação aparece nas listagens.
            </p>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-semibold mb-3">Próximos passos</h3>
            <ol className="space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="text-secondary font-mono">1.</span> Realize o pagamento via TED/PIX/SWIFT</li>
              <li className="flex gap-2"><span className="text-secondary font-mono">2.</span> Anexe o comprovante</li>
              <li className="flex gap-2"><span className="text-secondary font-mono">3.</span> Aguarde validação (~ até 1h útil)</li>
              <li className="flex gap-2"><span className="text-secondary font-mono">4.</span> Operação entra em monitoramento ativo</li>
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={highlight ? "text-foreground font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={"font-mono " + (highlight ? "text-secondary font-bold text-base" : "")}>{value}</span>
    </div>
  );
}

function KV({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3 p-3 rounded-lg bg-surface-container-low">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="font-mono text-sm flex items-center gap-2">
        {v}
        {copy && (
          <button onClick={() => navigator.clipboard?.writeText(v)} className="text-muted-foreground hover:text-secondary">
            <ClipboardCopy className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}
