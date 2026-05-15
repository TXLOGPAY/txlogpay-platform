import txlogpayLogo from "@/assets/txlogpay-logo.png";

export function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={txlogpayLogo} alt="TXLOGPAY" className={className} />;
}
