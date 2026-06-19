# Roles and Responsibilities — Loi 18-00

## Legal actors defined by the law

Loi 18-00 defines or implies four categories of people interacting with a copropriété. These map to roles in i9amati.

---

## 1. Syndic (property manager)

### Legal definition
The syndic is the **elected operational manager** of a syndicat des copropriétaires. Elected by the Assemblée Générale at a 3/4 majority, 2-year renewable mandate.

### Two forms
- **Syndic bénévole**: a co-owner who volunteers to manage the building (no automatic compensation — any allowance must be voted by the AG)
- **Syndic professionnel**: a professional management company hired by the AG (their fees are voted as part of the budget)

### Key powers
- Sole authority to collect charges without prior AG approval (Article 25)
- Can initiate legal payment order (*injonction de payer*) against defaulting co-owners (Article 25 bis)
- Represents the syndicat in court
- Executes all AG decisions
- Manages the syndicat's bank account exclusively

### i9amati role
- Primary user of the platform
- Manages apartments, payments, complaints, meetings, documents
- Is the **admin of a residence** — can create/update everything inside that residence
- A syndic can simultaneously be a co-owner (owner of an apartment) in the same residence — these are two separate profiles

---

## 2. Copropriétaire (property owner / co-owner)

### Legal definition
Any person holding a *fraction divise* (private lot) in the building. Membership in the syndicat is **automatic** — you cannot opt out.

### Obligations
- Pay monthly/periodic charges (*provisions*) set by the AG (Article 36)
- Participate in the AG and vote
- Comply with the *règlement de copropriété* (binding on all owners, even future ones)
- Tenants must also respect the rules (Article 31)
- If charges are unpaid, excluded from AG attendance (Article 16 quinquies)

### Rights
- Use and dispose of their private lot according to its designated use (Article 31)
- Use common areas according to their intended use
- Request inscription of questions on the AG agenda (Article 16 sexies)
- Challenge AG decisions within 2 months of notification
- If 1/3 of co-owners request it, can force the syndic to convene the AG (Article 16 quater)

### Owner with multiple lots
- A person owning multiple apartments holds multiple *fractions divises* → multiple vote counts proportional to their total *quote-part*
- If their total votes exceed half the total, they are automatically capped at half (Article 16 decies)

### Locataire (tenant)
- Not a co-owner, has no voting right in the AG
- Legally bound by the *règlement de copropriété* (Article 31)
- Can occupy the private lot but cannot attend or vote at the AG

### i9amati role
- Can view their payment history, submit complaints, see meeting minutes, read the community feed
- Scoped to residences/apartments they own
- One user can own apartments in multiple residences → multiple owner profiles (one per residence)
- Cannot have two owner profiles on the same residence (you're either an owner there or not)

---

## 3. Adjoint du syndic (deputy syndic)

### Legal definition
Elected alongside the syndic by the same AG vote and same majority. Legally defined as the syndic's backup.

### Powers
- Steps in automatically when the syndic is absent or incapacitated (Article 27)
- If syndic resigns, receives all archives and assets within 30 days (Article 26 ter)
- Can request court order to force departing syndic to hand over documents

### i9amati role
- Not a separate platform role currently; modeled as a `syndic` profile with a deputy flag, or handled implicitly within the syndic's team

---

## 4. Gardien / Prestataires (building staff and service providers)

### Legal definition
The law explicitly references the **gardien/concierge** (Article 20): the AG can hire, dismiss, and set working conditions for a concierge by simple majority vote. The concierge may be given a lodge (*loge*) by the syndicat.

Beyond the concierge, syndicats contract external providers: electricians, plumbers, cleaning services, elevator maintenance, security, etc. These are service contracts (*contrats de fourniture et d'exploitation*) that the syndic must make available to co-owners before the AG (Article 16 quinquies).

### Legal standing
- Prestataires/staff are **contractors of the syndicat** — not co-owners, not tenants
- No voting rights in the AG
- Bound by their service contracts with the syndicat

### i9amati role
- **Staff** role: a platform user profile for people who perform work for the residence
  - Can view relevant complaints/service requests assigned to them
  - Can update complaint/service request status
  - Cannot see financial data, vote, or manage residence settings
  - Contracted by the syndic — their account is created and managed by the syndic

---

## 5. Sudo (platform admin)

Not defined by Moroccan law — this is the i9amati platform operator role.

- Has access to all tenants and all data
- Used for platform management, onboarding new syndicats, support
- Not a resident role — operates above the copropriété layer
- Represented in the system as a platform-level role separate from the organization RBAC

---

## Multi-profile model

A single **user account** (email/identity) can hold multiple **profiles** within the same tenant/organization:

| Combination | Legal basis | Allowed |
|-------------|-------------|---------|
| Syndic + Owner (same residence) | A co-owner can be elected syndic | Yes |
| Owner of apartment A + Owner of apartment B (same residence) | One person can hold multiple lots | Yes — single owner profile covering both |
| Two separate Owner profiles on same residence | No legal basis | No — unique per residence |
| Syndic of Residence A + Syndic of Residence B | Professional syndic | Yes — separate profiles per residence |
| Staff + Owner (same residence) | Unusual but not prohibited | Platform decision |

Role uniqueness is enforced at **residence level**, not account level.

---

## Role summary table

| Role | Legal basis | Voting rights | Financial visibility | Creates/manages content |
|------|-------------|---------------|---------------------|------------------------|
| Syndic | Art. 19 | Votes as co-owner if also owner | Full | Full (within residence) |
| Owner | Art. 13, 14 | Yes (proportional to quote-part) | Own payments | Own complaints, feed posts |
| Tenant | Art. 31 | None | Own payments | Own complaints, feed posts |
| Staff / Gardien | Art. 20 | None | None | Update assigned tasks |
| Sudo | Platform | N/A | All | All (platform level) |
