# Project ZERO

## Detailed Whitepaper Draft

### Executive Summary

Project ZERO proposes a different merchant payment architecture. Rather than improving how reusable payment credentials are protected, it questions whether merchants should receive those credentials at all. The project replaces merchant-facing payment secrets with transaction-specific wallet authorization and verified settlement on Stellar.

Because Project ZERO uses wallet-based authorization rather than cards, the system does not contain card numbers, CVV codes, expiry dates, or tokens that could be replayed. The customer’s payment secret — whether that is a private key, seed phrase, or any equivalent authorization material — never leaves the customer’s wallet. The objective is not to eliminate every form of fraud, but to remove an entire class of credential-based fraud from merchants using the platform.

### Core Thesis

The payment industry has invested decades into protecting reusable credentials through CVV, EMV, 3DS, tokenization, behavioral analytics, and fraud engines. Project ZERO changes the underlying assumption. Authorization should belong to a single transaction rather than a secret that can potentially be reused. This changes the trust model from credential-centric to transaction-centric.

### Problem

MSMEs often depend on manual payment confirmation while larger payment systems continue to rely on reusable credentials. Merchant systems therefore remain attractive targets because they participate in handling payment secrets. Project ZERO minimizes merchant exposure by never requiring merchants to process any customer payment secret.

### Design Principles

1. **Never expose customer payment secrets to merchants.** The merchant sees only a public Stellar destination address and a transaction-specific memo. The customer authorizes each payment inside their own wallet.
2. **Every payment is explicitly authorized for one invoice.** Each payment request has a unique memo and shareable link. The authorization is scoped to that single invoice.
3. **Merchant compromise should not expose customer payment secrets.** Because no customer payment secret is ever stored or transmitted through the merchant stack, there is no credential payload for an attacker to steal.
4. **The payment request becomes the unit of trust.** Settlement is verified on-chain against the memo, destination, amount, and asset code. The invoice, not a reusable credential, ties authorization to value transfer.

### MVP

Merchant creates an invoice, generates a QR code and payment link, the customer reviews the invoice in their wallet, authorizes the payment, Stellar settles, and the merchant dashboard automatically marks the invoice as paid. No screenshots. No manual reconciliation.

### Why Stellar

Stellar provides wallet authorization, fast settlement, low fees, and composability. The blockchain is the settlement layer rather than the product itself.

### Security Model and Honest Limitations

Project ZERO removes customer payment secrets from the merchant trust boundary. That is the central security claim, and it holds by construction: the customer signs the transaction locally in their wallet and submits it to the Stellar network. The merchant backend only verifies the resulting on-chain transaction.

This is different from saying the merchant cannot be compromised in other ways. A stolen merchant session could create fake invoices or change the `stellar_destination` on newly created payment requests. The current system mitigates that through Supabase authentication, row-level security, server-side validation, and the fact that customers approve the destination and amount in their wallet before signing. However, those controls address merchant-account integrity; they are not the same guarantee as “the merchant never holds customer payment secrets.”

The whitepaper therefore distinguishes two trust boundaries:

- **Customer payment secrets:** never exposed to the merchant or the Project ZERO backend.
- **Merchant account integrity:** protected by auth, RLS, and server-side validation, but still requiring the merchant to keep their own credentials safe.

### Vision

Project ZERO begins with MSMEs because they have immediate operational pain and lower adoption barriers. Over time the same architecture can evolve into APIs and SDKs for larger merchants without changing the underlying philosophy: one invoice, one authorization, verified settlement, no reusable customer payment secrets.
