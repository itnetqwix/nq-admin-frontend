#!/usr/bin/env node
/**
 * Validates admin payment-flow UI bridges documented in PAYMENT_FLOW_COVERAGE.md.
 * Static checks — no browser required.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CHECKS = [
  {
    file: "src/pages/components/modal/BookingDetailDrawer.jsx",
    includes: ["/apps/finance?sessionId=", "releaseEscrowHold", "refundEscrowHold"],
  },
  {
    file: "src/pages/apps/finance/index.js",
    includes: [
      "migrateLegacyBalances",
      "ledgerReferenceType",
      "escrowStatus",
      "canRefund",
      "refundWalletSession",
    ],
  },
  {
    file: "src/services/financeApi.js",
    includes: [
      "searchFinanceTransactions",
      "getRefundQueue",
      "getEscrowSummary",
      "migrateLegacyBalances",
      "releaseEscrowHold",
      "refundEscrowHold",
    ],
  },
  {
    file: "src/pages/apps/booking/index.js",
    includes: ["refundWalletSession", "BookingDetailDrawer"],
  },
];

let failed = 0;

for (const check of CHECKS) {
  const full = path.join(root, check.file);
  if (!fs.existsSync(full)) {
    console.error(`[FAIL] missing ${check.file}`);
    failed += 1;
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  let fileOk = true;
  for (const needle of check.includes) {
    if (!text.includes(needle)) {
      console.error(`[FAIL] ${check.file}: expected "${needle}"`);
      failed += 1;
      fileOk = false;
    }
  }
  if (fileOk) console.log(`[OK] ${check.file}`);
}

if (failed > 0) {
  console.error(`\n${failed} admin payment-flow check(s) failed\n`);
  process.exit(1);
}

console.log(`\nAdmin payment-flow UI validation passed (${CHECKS.length} files).\n`);
