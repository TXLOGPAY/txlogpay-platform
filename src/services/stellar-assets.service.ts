import { Asset } from "@stellar/stellar-sdk";

const issuerPublic = import.meta.env.VITE_STELLAR_ISSUER_PUBLIC;

export function getOperationalAsset(currency: string) {
  const code = `${currency.toUpperCase()}TX`;

  return new Asset(code, issuerPublic);
}