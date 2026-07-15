# Privacy-Preserving Payment Channels and Architectures

## Proposal Summary and Analysis

This document summarizes and analyzes the five-page proposal, *Privacy-Preserving Payment Channels and Architectures*.

## Executive Summary

The proposal describes a payment intermediary that allows customers to pay merchants without giving merchants their identity, contact details, or underlying payment information.

Instead of paying a merchant directly through a conventional processor such as Stripe, the customer would follow this flow:

```text
Customer --KYC and funds--> Privacy platform
Customer <--anonymous payment tokens-- Privacy platform

Customer --token--> Merchant
Merchant --redeem token--> Privacy platform
Merchant <--confirmation and settlement-- Privacy platform
```

The platform knows that the customer passed KYC and supplied legitimate funds. The merchant sees only a valid token and confirmation that payment was made.

The central idea is:

> Separate identity verification from the act of purchasing something.

This is conceptually similar to digital cash or prepaid vouchers. The proposal combines this model with blind signatures, zero-knowledge proofs, pseudonymous credentials, and potentially Stellar and Soroban.

## The Problem It Is Trying to Solve

A conventional Stripe-style transaction can expose the customer's:

- Name
- Email and phone number
- Billing and shipping address
- Transaction amount and date
- Masked card information
- Purchase history or reusable customer identifiers

Even when the card number is tokenized, the merchant may still receive enough information to identify and profile the customer.

The proposal considers this a privacy weakness because merchant records can be:

- Used for customer profiling
- Leaked in a data breach
- Correlated with other databases
- Obtained through legal or regulatory requests
- Retained longer than the customer expects

Its goal is not necessarily to hide the transaction from everyone. Its primary goal is to stop the merchant from learning the payer's real identity.

## Proposed System

### 1. Registration and KYC

The customer registers with the privacy platform.

The platform performs normal identity verification, potentially using:

- BSP-approved electronic KYC
- PhilSys
- A regulated banking or payment partner
- Conventional AML and sanctions screening

The customer's identity is therefore known to the platform, but not to individual merchants.

### 2. Buying Private Payment Tokens

The customer sends money to the platform using a card, bank transfer, cryptocurrency, or another supported method.

The platform issues anonymous digital tokens of corresponding value. These are comparable to digital banknotes or gift vouchers.

The document proposes using blind signatures so the platform can certify that a token is genuine without necessarily seeing the final token that will later be spent.

### 3. Paying a Merchant

At checkout, the customer sends one or more tokens instead of card and personal details.

The merchant calls a simple platform API, conceptually:

```text
redeem(token)
```

The platform checks that:

- The token is authentic
- The token has not previously been spent
- The token has sufficient value
- Any required compliance conditions are satisfied

If valid, the platform marks it as spent and confirms the payment.

### 4. Merchant Settlement

The platform pays the merchant from escrow or from funds previously received during token issuance.

The merchant learns:

- That a valid payment occurred
- Which order the payment should be associated with
- The settlement amount
- Possibly a one-time pseudonymous reference

The merchant should not learn:

- The customer's legal identity
- Their bank or card account
- Their permanent email or phone number
- Their transaction history at other merchants

### 5. Auditing and Regulatory Access

The proposal suggests retaining a separate compliance layer.

Depending on the final design, regulators might be able to:

- Confirm that tokens came from KYC-approved users
- Block tokens associated with prohibited sources
- Investigate a particular transaction under legal authority
- Review commitments or encrypted audit records

It also mentions association sets, where a user proves they belong to an approved group without revealing exactly which member they are.

## Cryptographic Approaches Discussed

The proposal surveys several technologies rather than selecting one definitive protocol.

### Blind Signatures and Digital Cash

A customer creates a token and hides, or blinds, it before asking the platform to sign it. The platform signs the hidden token without seeing its final form.

After removing the blinding, the customer has a valid token that can be spent. The signature proves it was legitimately issued, but ideally the issuer cannot match it to the issuance event.

This is the clearest match for the proposed voucher architecture.

### Zero-Knowledge Proofs

A zero-knowledge proof lets someone prove that a statement is true without revealing the underlying secret.

In this system, a customer might prove that:

- They own a valid payment commitment
- The funds have not already been spent
- The token came from an approved source
- The payment amount balances correctly

The proposal specifically references privacy pools on Stellar and Groth16 zk-SNARKs using commitments and nullifiers.

A commitment hides information such as an owner or amount. A nullifier is a unique value revealed when spending, allowing the system to reject a second use without exposing the original deposit.

### Pseudonymous Credentials

The platform could issue credentials proving that the customer is authorized or KYC-approved without exposing their identity.

Different one-time credentials could prevent merchants from correlating purchases belonging to the same person.

### Homomorphic Encryption and Secure Multiparty Computation

These techniques could theoretically perform fraud or risk calculations on protected data.

They are presented as more advanced possibilities, not as a concrete part of the proposed implementation. They would add substantial complexity and are probably unnecessary for an initial version.

### Tokenization

Existing payment tokenization replaces sensitive card data with a safer identifier. The proposal extends that idea to identity information.

However, reusable pseudonyms can still allow tracking. Tokens must be one-time or rotated if unlinkability is required.

## Handling Physical Delivery

Digital products are the easiest use case because no physical address is required.

For physical goods, the payment can be private while delivery still reveals the customer. The proposal suggests:

- Parcel lockers
- Privacy mailboxes
- One-time delivery addresses
- The platform acting as a forwarding service
- The platform accepting delivery and reshipping under its own name

This is an important distinction: anonymous payment alone does not provide an anonymous purchase if the merchant receives a home address.

## What the Proposal Does Well

The strongest part is the separation of roles:

- The platform handles identity, KYC, and funding.
- The merchant handles the order.
- The token connects the payment to the order without directly connecting the identity.

It also correctly recognizes that:

- Tokenizing a card alone does not protect identity.
- Merchants should receive only the minimum information required.
- Digital goods are a practical first market.
- Double-spending must be prevented.
- Privacy needs to coexist with compliance.
- Complex cryptography should remain inside the wallet and backend, leaving merchants with a simple API.

The last point is especially valuable commercially. Merchants are unlikely to integrate a system requiring them to understand zk-SNARKs or blind signatures.

## Important Weaknesses and Unresolved Questions

### The Platform's Privacy Level Is Unclear

The document sometimes says the platform records which tokens belong to which customer. Elsewhere, it describes blind signatures that prevent the issuer from linking issuance and spending.

Those are two different privacy models:

1. **Merchant privacy:** The platform can trace everything, but the merchant cannot.
2. **Issuer-unlinkable digital cash:** Even the platform cannot normally connect a redeemed token with the customer who acquired it.

The project needs to choose explicitly between them. Recording a direct customer-to-token mapping removes much of the protection offered by blind signatures.

### The Platform Becomes a Highly Trusted Custodian

The platform receives customer funds, stores value, issues tokens, prevents double-spending, and settles merchants.

That potentially makes it function like:

- An electronic money issuer
- A payment service provider
- A stored-value facility
- A custodial wallet
- A money transmitter

This creates licensing, reserve, safeguarding, audit, operational, and insolvency questions that the proposal does not address.

### Hiding the Amount from the Merchant Is Impractical

A merchant normally knows the price of its own product and must reconcile the amount received. Amount privacy may protect the transaction from public blockchain observers, but it cannot meaningfully hide the sale price from the merchant.

The realistic promise is:

> The merchant knows the order total but not the customer's funding source or identity.

### Metadata Can Defeat Cryptographic Privacy

Even if token contents are private, transactions can be correlated through:

- Exact token amounts
- Purchase and issuance timing
- IP addresses
- Browser fingerprints
- Wallet identifiers
- Merchant order data
- Platform logs
- Bank funding records
- Unique combinations of token denominations

The proposal focuses heavily on cryptography but does not provide a complete metadata threat model.

### Denominations and Change Are Not Defined

A digital-cash system must decide whether tokens have:

- Fixed denominations
- Arbitrary hidden values
- Divisible balances
- Change tokens
- A private wallet balance

For example, spending a PHP 1,000 token on a PHP 730 order requires a private and safe way to return PHP 270. This is a core protocol decision.

### Refunds, Disputes, and Chargebacks Are Missing

The system still needs answers for:

- Customer refunds
- Merchant disputes
- Card chargebacks after tokens have been spent
- Lost or stolen tokens
- Expired tokens
- Merchant non-delivery
- Partial refunds
- Incorrect payment amounts

Bearer tokens behave like cash: whoever possesses the secret may be able to spend them. Recovery and consumer protection therefore require careful design.

### Compliance Claims Need Legal Verification

The document presents several Philippine, EU, U.S., and FATF claims, but it does not include a complete bibliography or working source links. The bracketed citations appear to be references from an earlier research system rather than usable citations in the PDF.

The legal statements should be treated as research leads, not as confirmed legal conclusions, especially references to a Philippine "Digital Payments Act (2025)," transaction anonymity, selective disclosure, and regulator access.

### The Proposal Combines Too Many Technologies

Blind e-cash, zero-knowledge privacy pools, anonymous credentials, homomorphic encryption, secure multiparty computation, Stellar, escrow, and physical forwarding are all discussed.

These do not need to be implemented together. Without choosing a primary protocol, the proposal is more of a concept survey than an implementable technical design.

### It Is Not Strictly a Payment Channel

In blockchain terminology, a payment channel usually means an off-chain mechanism in which parties lock funds and update balances before final settlement.

This proposal is closer to:

> A privacy-preserving custodial payment gateway using anonymous bearer tokens.

Calling it a payment channel could create confusion unless an actual state-channel mechanism is planned.

## Best Practical Interpretation for This Project

A sensible minimum viable product derived from the proposal would be:

1. Limit the first version to digital goods or services.
2. Perform KYC at the platform level.
3. Let users fund a platform balance using an existing regulated payment provider.
4. Issue one-time blind-signed vouchers in fixed denominations.
5. Give merchants a simple redemption API.
6. Make redemption atomic: verify, mark spent, and credit the merchant in one operation.
7. Give each payment a merchant-specific order reference that contains no customer identity.
8. Avoid reusable customer identifiers.
9. Maintain a legally reviewed compliance and audit policy.
10. Add a Stellar or zero-knowledge privacy pool only after the basic voucher model is proven.

This would validate whether merchants and customers value the privacy layer before committing to expensive zero-knowledge infrastructure.

## Decisions Required Before Implementation

The team needs to define:

- Exactly who is trusted
- Who can trace a payment
- What information each party sees
- Token denominations and change
- Refund and dispute behavior
- Double-spend prevention
- Metadata protections
- Platform custody and licensing
- Regulatory disclosure rules
- Whether Stellar is essential or optional

## Overall Assessment

The proposal has a strong product idea: merchants should be able to confirm that a legitimate, verified customer paid without receiving that customer's identity.

Its most viable foundation is a blind-signed digital-cash or voucher system with a regulated intermediary. Stellar and zero-knowledge proofs could later improve on-chain privacy and reduce how much the intermediary can observe.

However, the document is still an architectural concept, not a complete protocol specification. Its central privacy guarantee, regulatory structure, and operational mechanics need to be specified before it can safely become a production design.

In one sentence:

> This is a promising privacy-focused payment gateway proposal, but its privacy model, regulatory structure, and operational mechanics still need to be defined before implementation.
