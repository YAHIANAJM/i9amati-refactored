# Property Types — Loi 18-00

## Scope of the law (Article 1)

Loi 18-00 applies to two categories of built real estate:

1. **Single building (copropriété verticale)** — a building divided into floors, apartments, or units owned by multiple persons. Each unit is a *fraction divise* (private lot) plus a *quote-part* (fractional share) of the *parties communes*.

2. **Residential complex (ensemble immobilier / copropriété horizontale)** — a set of contiguous or separate buildings, villas, or units on a shared land, each having private portions plus common areas belonging collectively (*en indivision*) to all co-owners.

Both categories are legally equivalent under the law. The main structural difference is the governance layer added for complexes (see [governance-structure.md](./governance-structure.md)).

---

## Titres fonciers (land registration titles)

Morocco's land registration (*immatriculation foncière*) assigns a **titre foncier** (TF) number to each registered parcel. Under copropriété:

### Simple residence
- **1 titre foncier originel** — covers the whole land + all common areas
- Each apartment/unit gets a **titre foncier distinct** (partial TF) created by the *conservateur de la propriété foncière* (Article 49)
- The *titre foncier originel* lists all common areas, their locations, surfaces, and the TF numbers of each private lot (Article 54)

### Complex residence (ensemble immobilier)
- **TF per block/building** — each building or section of the complex that was developed separately may have its own *titre foncier*
- **TF for global common areas** — a separate TF covers the land and shared amenities (gardens, parking, garages, etc.) belonging to the entire complex
- This results in the 3-TF structure: Block A TF + Block B TF + Global Common TF
- The *quote-part* of each private lot can be fixed provisionally during phased construction and adjusted definitively at completion (Article 6)

> **Platform implication**: A `Residence` in i9amati can be standalone (1 TF origin) or part of a `ResidenceComplex` (multiple TFs). The complex has a separate legal entity (conseil syndical) managing the global common areas.

---

## Parties privatives vs parties communes

### Parties privatives (Article 2)
The private lot (*fraction divise*) that belongs exclusively to one co-owner:
- The apartment/unit itself
- For villas/standalone units: the land on which it is built + annexed gardens (when the complex has a single shared TF for villas)

### Parties communes (Article 4) — mandatory
By default, unless the *titre de propriété* states otherwise:
- The land (ground) — except villas with their own land
- Structural elements: foundations, load-bearing walls, façade
- Rooftops intended for common use
- Staircases, corridors, passages, entrances, basements, elevators
- Walls/partitions separating two private units (Article 4 bis — these are common *only between* the adjacent units)
- Common equipment and their parts that cross private units
- Garbage rooms, chimneys, ventilation ducts

### Parties communes — by default unless otherwise stated
- Courtyards and gardens
- Locals for common use
- Generally: anything intended for common use

### Parties communes spéciales (Article 16 undecies)
When an equipment or part of the building is reserved for *exclusive use by a subset of co-owners*, only those co-owners bear the related charges and vote on decisions concerning those parts. This is the legal basis for **shared amenities in a complex** (e.g., a parking shared by Blocks A and B only).

---

## Quote-part (voting weight and charge share)

Each private lot carries a **quote-part indivise** — a fractional share of the common areas expressed as a ratio. This determines:
- The co-owner's share of common charges
- Their number of votes in the general assembly (Article 16 decies)

A single co-owner holding more than half the total votes has their votes automatically reduced to half the remaining total (to prevent domination).

---

## Key article references

| Topic | Article |
|-------|---------|
| Scope of the law | Art. 1 |
| Definition of parties privatives | Art. 2 |
| Definition of parties communes | Art. 4, 4 bis |
| Quote-part and co-ownership share | Art. 6 |
| Parties communes spéciales | Art. 16 undecies |
| Titre foncier distinct per unit | Art. 49 |
| Titre foncier originel content | Art. 54 |
