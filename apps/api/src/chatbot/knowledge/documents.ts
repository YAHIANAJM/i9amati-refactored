// ─── IQAMATI Knowledge Base: Document Content ─────────────────────────────
// Embeds the full text of IQAMATI_Story.md and the Moroccan co-ownership law
// as string constants for RAG retrieval. This avoids filesystem reads at runtime.

export interface DocumentSource {
  id: string
  title: string
  content: string
}

export const IQAMATI_STORY: DocumentSource = {
  id: 'iqamati_platform',
  title: 'IQAMATI Platform Overview',
  content: `
IQAMATI — The Human Story

"إقامتي" — My Residence in Arabic

What is IQAMATI?

IQAMATI is a digital platform built specifically for managing apartment buildings in Morocco. The name comes from the Arabic word إقامتي — meaning "my residence" — and that name says everything: this tool exists to make the place you call home run better, cleaner, and more fairly.

It was created by GSDF CLAIR (Gestion · Syndic · Développement Digital · Futur Clair) to bring Moroccan building management into the digital age — replacing the chaos of spreadsheets, paper receipts, and endless phone calls with one unified platform, available on both web and mobile.

The Problem It Solves

When you live in an apartment building in Morocco, someone has to take responsibility for keeping it running. That person — or company — is called the Syndic.

The syndic's job includes:
- Collecting monthly or annual maintenance fees from every owner
- Paying for shared services: cleaning, security, maintenance, elevator repairs
- Handling complaints from residents
- Organizing official owner meetings (required by Moroccan law)
- Managing all legal and financial documents
- Keeping records of who visits the building

In practice, this is almost always done through a mess of WhatsApp groups, handwritten receipts, physical folders, and memory. Payments get lost. Owners dispute what they owe. Documents go missing. Meetings become arguments because no one has proper records.

IQAMATI replaces all of that — bringing structure, transparency, and legal compliance to a process that has needed it for decades.

Why It Matters in the Moroccan Context

Morocco has a specific legal framework governing apartment buildings and co-ownership (copropriété), including laws that require:
- Formal owner meetings with documented quorum and voting records
- Proper financial accounting for shared building funds
- Official procès-verbaux (meeting minutes) signed and archived
- Compliance with Moroccan fiscal and administrative regulations

Most syndics — especially independent ones managing multiple buildings — cannot realistically meet all these requirements manually. IQAMATI makes legal compliance the default, not an afterthought.

It also addresses a social reality: in many Moroccan buildings, trust between the syndic and owners breaks down because there is no transparency. Owners don't know where their money went. The syndic has no easy way to prove they did their job. IQAMATI creates a shared, verifiable record that both sides can trust.

Who Uses IQAMATI?

IQAMATI is built for everyone involved in a building — each with their own dedicated view and permissions.

1. The Syndic (Building Manager)
The primary user. The person who runs everything.

The syndic — whether an individual or a management company — gets the full dashboard. They can see every building they manage, every payment, every complaint, every document, and every scheduled meeting. They generate official reports, assign tasks, and have a bird's-eye view of their entire portfolio.

Think of the syndic as the CEO of the building — IQAMATI is their operating system.

2. Property Owners (Propriétaires)
The residents and co-owners of the building.

Owners get their own portal where they can:
- View their outstanding fees and pay online
- Track their payment history
- Submit maintenance complaints
- Participate in votes during official meetings
- Download their ownership documents

No more calling the syndic to ask "did you receive my payment?" — it's all there, in real time.

3. Supervisors
The oversight layer.

Supervisors have an administrative view across multiple syndics or buildings — used by management companies or holding structures to monitor performance, agent activity, and financial health without being involved in day-to-day operations.

4. Contracted Service Companies
Cleaning, maintenance, gardening, elevator technicians — anyone hired to service the building.

Each service company gets their own dedicated app view — completely separate from the syndic's space. They can:
- See their work schedule and assigned tasks
- Log completed jobs with notes and photos
- Submit service reports
- Manage their workers' planning

They never see financial data, owner information, or anything outside their scope. Clean separation, clean workflow.

5. Security Personnel
Staff from contracted security companies guarding the building.

Security personnel get a focused, real-time access log view. Their job in IQAMATI is simple and critical:
- Register every visitor entering the building (name, ID, purpose, target apartment)
- Log deliveries (food, packages, services)
- Mark entries and exits with timestamps
- Flag or hold visitors pending resident approval

The syndic sees the full historical record across all buildings. Security sees only their assigned building's live log. Nothing more, nothing less.

The Bottom Line

IQAMATI is what happens when you take the chaos of managing an apartment building in Morocco — the fees, the complaints, the meetings, the paperwork, the visitors — and replace it with one clean, legal, multilingual platform that works for everyone involved.

From collecting fees to running a legally valid general assembly to tracking who fixed the elevator and who delivered a package at 3pm on a Tuesday — everything a syndic needs, in one place, on their phone or computer.

Built for Morocco. Built for the people who keep buildings running.

Powered by GSDF CLAIR | iqamati.ma
Supports: Arabic (RTL) · French · Tamazight · English

IQAMATI Platform Features:
- Dashboard: Global overview of all buildings, payments, complaints, and meetings
- Apartments Management: Track all apartments, owners, tenants, and occupancy status
- Payments: Collect and track monthly/annual maintenance fees, generate receipts
- Documents: Store and manage all building documents, contracts, and legal papers
- Meetings & Voting: Schedule assemblée générale, manage quorum, record votes and decisions
- Accounting: Full financial management with budget tracking, expenses, and reports
- Feed Management: Building community feed for announcements and updates
- Service Tracking: Monitor contracted services (cleaning, maintenance, security)
- Alerts & Notifications: Real-time alerts for payments due, complaints, and meetings
- Union Members: Manage the syndic union across multiple buildings
- Residences: Manage multiple residential properties and buildings
- Profile Management: User profiles with role-based access control
- Visitor Logging: Security personnel register visitors, deliveries, and access events

User Roles in IQAMATI:
- ADMIN: Full system administrator
- SYNDIC: Building manager with full dashboard and management capabilities
- OWNER: Property owner with payment, complaint, and voting access
- TENANT: Tenant with limited access to building services
- STAFF: Service company or security staff with task-specific access
`
}

export const MOROCCAN_LAW: DocumentSource = {
  id: 'moroccan_copropriete_law',
  title: 'Moroccan Co-ownership Law (Loi 18-00 & 106-12)',
  content: `
Moroccan Co-ownership Law — Loi n° 18-00 relative au statut de la copropriété des immeubles bâtis, as modified by Loi n° 106-12.

Chapitre premier — Dispositions générales

Article premier: Les dispositions de la présente loi s'appliquent à la propriété des immeubles bâtis divisés par appartements ou étages ou locaux et dont la propriété appartenant à plusieurs personnes est répartie par lots comprenant chacun une partie privative et une quote-part des parties communes. Elles sont applicables également aux ensembles immobiliers bâtis constitués d'immeubles, villas ou locaux, contigus ou séparés, répartis en parties privatives et parties communes appartenant dans l'indivision à l'ensemble des copropriétaires. Les présentes dispositions s'appliquent aux immeubles immatriculés ou en cours d'immatriculation ou non immatriculés.

Article 2: Sont considérées comme parties privatives des immeubles, les parties bâties ou non bâties appartenant à chaque copropriétaire dans le but d'en jouir individuellement et personnellement. Elles sont la propriété exclusive de chaque copropriétaire. Sont également considérés comme parties privatives le sol sur lequel est édifié le bâtiment et les jardins qui lui sont annexés le cas échéant, réservé aux villas ou aux locaux, disposant d'un titre foncier unique lorsqu'un ensemble de villas ou de locaux est soumis à la présente loi.

Article 3: Sont considérées comme parties communes des immeubles, les parties bâties ou non bâties destinées à l'usage et à la jouissance de l'ensemble des copropriétaires ou de certains d'entre eux.

Article 4: Sont réputées parties communes:
- le sol sous réserve de l'alinéa 2 de l'article 2 ci-dessus
- les gros œuvres de l'immeuble, les fondations et les murs porteurs
- les caves quelle que soit leur profondeur si elles sont destinées à l'usage commun
- la façade de l'immeuble
- les toits destinés à l'usage commun
- les escaliers, les passages et les corridors destinés à l'usage commun
- les entrées, les sous-sols et les ascenseurs destinés à l'usage commun
- les murs et cloisons séparant deux parties privatives
- les équipements communs, y compris les parties y afférentes qui traversent les parties privatives
- les coffres, les têtes de cheminée et les bouches d'aération destinés à l'usage commun
- les lieux destinés au dépôt des ordures ménagères
Sont considérées également comme parties communes, sauf stipulation dans les titres de propriété ou en cas de contradiction entre ces titres:
- les cours et les jardins
- les locaux destinés à l'usage commun
Et, d'une manière générale, toute partie considérée comme telle ou que la nature de l'immeuble exige qu'elle soit destinée à l'usage commun.

Article 4 bis: Les murs et les cloisons, non porteurs de bâtiment, séparant deux fractions divises ou plus, sont considérés comme parties communes entre lesdites fractions uniquement.

Article 5: Sont considérés comme droits accessoires aux parties communes:
- le droit de surélévation de l'immeuble destiné à l'usage commun
- le droit d'édifier de nouvelles constructions dans les cours ou dans les jardins et dans leurs sous-sols
- le droit d'excavation

Article 6: Sauf disposition contraire des titres de propriété ou que l'assemblée générale en décide autrement, la quote-part de chaque copropriétaire dans les parties communes est en fonction de l'étendue de sa partie individuelle par rapport à l'étendue de l'ensemble des parties individuelles de l'immeuble. S'il s'agit d'un projet immobilier réalisé en étapes consécutives, la quote-part de chaque propriétaire dans les parties communes peut être fixée de manière provisoire, dans le règlement de copropriété, pour la partie dont les travaux sont achevés, à charge de la fixer définitivement à l'achèvement du projet immobilier.

Article 7: Les parties communes et les droits y afférents ne doivent faire l'objet ni d'une répartition, d'une saisie ou d'une cession entre l'ensemble des copropriétaires ou certains d'entre eux, ni d'une vente forcée indépendamment de la fraction indivise.

Article 9: Le règlement de copropriété comporte obligatoirement les éléments suivants:
- la destination des parties privatives et communes et les conditions de leur usage
- la définition des règles relatives à l'administration des parties communes et le droit de jouissance y afférent
- la répartition des quotes-parts d'indivision relatives aux parties communes à chaque fraction divise
- la définition des règles de gestion du syndicat et de la tenue de l'assemblée générale des copropriétaires et ses attributions
- les règles et les critères de désignation du syndic et de son adjoint
- la fixation des charges relatives à la conservation, à l'entretien et à l'administration de la copropriété
- la fixation des charges relatives au fonctionnement et à l'entretien des équipements communs
- la fixation des charges de chaque service collectif décidé par le syndicat
- la fixation de la part de chaque propriétaire dans les charges, selon la quote-part indivise correspondant à chaque partie privative
Le règlement de copropriété est signé par le propriétaire initial ou les copropriétaires ou leurs mandataires.

Article 11: Le règlement de copropriété doit faire l'objet d'un dépôt et d'un enregistrement au registre foncier auprès de la conservation foncière du lieu de situation de l'immeuble. Le vendeur doit mettre à la disposition de l'acquéreur une copie du règlement de copropriété.

Chapitre II — De l'administration et de la gestion de la copropriété

Section première — Le syndicat des copropriétaires

Article 13: Tous les copropriétaires des immeubles visés à l'article premier de la présente loi, se trouvent de plein droit groupés dans un syndicat doté de la personnalité morale et de l'autonomie financière, à compter de la date de l'inscription de la première cession concernant ces immeubles. Le syndicat a pour objet la conservation, l'entretien et l'administration des parties communes et, le cas échéant, la fourniture de services collectifs aux copropriétaires en relation avec la gestion de la copropriété. Le syndicat a droit, faute de conciliation, d'ester en justice même contre l'un des copropriétaires de manière individuelle ou collective avec les copropriétaires lésés. Le syndicat est administré par une assemblée générale et géré par un syndic et son adjoint.

Article 14: Tout copropriétaire est de plein droit membre du syndicat. Il est tenu de participer aux activités du syndicat notamment au vote des décisions prises par l'assemblée générale.

Article 14 bis: Les ressources du syndicat se composent, notamment:
- des contributions des copropriétaires aux charges telles que fixées par l'assemblée générale et dans le règlement de copropriété
- des sommes provenant de la cession ou la location de l'un des biens du syndicat, le cas échéant
Le syndicat a droit d'acquérir des fractions divises sans que celles-ci perdent leur caractère privatif.

Section 2 — L'assemblée générale

Article 15: L'assemblée générale procède à la gestion de l'immeuble en copropriété conformément à la loi et au règlement de copropriété et prend des décisions dont l'exécution est confiée à un syndic ou à son adjoint.

Article 16: L'assemblée générale tient sa première réunion sur convocation faite par l'un ou plusieurs copropriétaires. Les copropriétaires sont convoqués par lettre recommandée avec accusé de réception, par huissier de justice ou par tout moyen légal de notification, quinze (15) jours avant la date fixée pour la réunion.

Article 16 bis: L'assemblée générale, procède, lors de sa première réunion, à l'établissement du règlement de copropriété s'il n'est pas élaboré, ou à sa modification le cas échéant. Elle procède également à la désignation du syndic et de son adjoint, conformément aux dispositions de la présente loi, ainsi qu'à l'approbation du budget prévisionnel et la fixation de la quote-part de chaque copropriétaire dans le syndicat.

Article 16 ter: L'assemblée générale ordinaire se réunit au moins une fois par an dans un délai n'excédant pas trente (30) jours de la fin de l'année courante. Une assemblée générale extraordinaire peut être tenue chaque fois qu'il est nécessaire.

Article 16 quinquies: La convocation à l'assemblée générale est notifiée à tout copropriétaire par lettre recommandée avec accusé de réception, par huissier de justice ou par tout moyen légal de notification à la dernière adresse personnelle ou professionnelle communiquée au syndic, et ce quinze (15) jours au moins avant la date fixée pour la réunion. L'assemblée générale se tient à l'intérieur du ressort territorial de la commune du lieu de situation de l'immeuble en copropriété.

Article 16 decies: Chaque propriétaire dispose d'un nombre de voix correspondant à sa quote-part dans la fraction divise qui lui revient. Toutefois, si un propriétaire dispose d'un nombre de voix supérieur à la moitié de la somme des voix revenant au reste des propriétaires, le nombre de voix dont il dispose est réduit à la moitié des voix dont dispose l'ensemble des propriétaires. Le copropriétaire peut mandater un tiers pour voter en son nom, qu'il soit membre ou non du syndicat, à condition que le mandataire ne représente pas plus de trois (3) copropriétaires, dont le total des quotes-parts ne dépassent pas 10% des voix de l'ensemble des copropriétaires.

Article 18: La réunion de l'assemblée générale du syndicat est valable si la moitié au moins des copropriétaires ou de leurs représentants sont présents. Si ce quorum n'est pas atteint, une seconde réunion est tenue dans un délai de 30 jours, quel que soit le nombre des copropriétaires présents ou représentés, et prend ses décisions à la majorité.

Article 19: L'assemblée générale désigne parmi les propriétaires présents ou représentés, un syndic ainsi que son adjoint, à la majorité des trois quarts des voix des copropriétaires. Le syndic peut être désigné parmi les tiers et peut être une personne physique ou morale exerçant la profession de gestion des immeubles. Le syndic et son adjoint sont nommés pour une durée de deux ans renouvelable.

Article 20: Sont prises à la majorité relative des voix des copropriétaires présents ou représentés, les décisions suivantes:
- entretenir l'immeuble en copropriété et assurer la sécurité et la quiétude de ses habitants
- autoriser certains copropriétaires à réaliser, à leur frais, des travaux affectant les parties communes
- installer des antennes et des paraboles communes et tous équipements ou installations similaires
- aménager les lieux destinés aux rituels religieux sacrificiels
- prendre les dispositions afin de faciliter l'accessibilité des personnes en situation de handicap
- désigner, révoquer et définir les conditions de travail du concierge

Article 21: L'assemblée générale statue, à la majorité des trois quarts des voix des copropriétaires, sur les questions suivantes:
- élaboration ou amendement du règlement de copropriété
- réalisation des travaux d'amélioration de l'immeuble
- désignation et révocation du syndic et de son adjoint
- révision de la répartition des charges communes
- fixation des émoluments du syndic et de son salaire
- approbation du budget du syndicat, fixation des charges, du plafond des dépenses et de la réserve pour les grands travaux d'entretien
- réalisation des grands travaux d'entretien
- souscription à une assurance collective contre les risques
- mandater le syndic ou des tiers pour prendre certaines mesures
- institution d'un droit de préférence pour les actes emportant transfert de propriété à titre onéreux
- démolition partielle de l'immeuble

Article 22: Sont prises à l'unanimité des copropriétaires les décisions concernant:
- édification de nouveaux bâtiments ou surélévation
- cession du droit de surélévation ou aménagement de nouveaux espaces
- réalisation de travaux apportant des transformations aux parties communes
- transformation de parties communes en parties privatives à usage privé
- droit de surélévation ou d'excavation
- démolition totale de l'immeuble

Article 24: Pour faire face aux dépenses de maintenance et d'administration des parties communes, l'assemblée générale vote chaque année un budget prévisionnel et une provision pour les grands travaux d'entretien. Elle est réunie dans un délai de six mois à compter du dernier jour de l'exercice comptable précédent.

Article 25: Le syndic recouvre les contributions exigibles et n'a besoin d'aucune autorisation préalable de l'assemblée générale pour les réclamer par voie de justice. A défaut du versement à sa date d'exigibilité, les autres provisions non encore échues deviennent immédiatement exigibles après mise en demeure.

Article 25 bis: Le président du tribunal de première instance prononce l'injonction de payer sur la base des documents suivants:
- Le procès-verbal de l'assemblée générale approuvant le montant des charges
- Le relevé de compte de dettes du propriétaire débiteur approuvé par le syndic
- Le certificat de propriété prouvant la quote-part du propriétaire débiteur
- Une attestation justifiant la mise en demeure du propriétaire

Section 3 — Le syndic et son adjoint

Article 26: Le syndic est chargé notamment:
- d'exécuter les dispositions du règlement de copropriété
- de concrétiser les décisions de l'assemblée générale
- de veiller au bon usage des parties communes en assurant leur entretien
- d'effectuer les réparations urgentes même d'office
- de préparer le projet du budget du syndicat
- de collecter les participations des copropriétaires aux charges contre récépissé
- de délivrer un récépissé de décharge au copropriétaire
- d'établir le budget du syndicat et la tenue de la comptabilité
- d'informer les copropriétaires de la situation de la trésorerie du syndicat, au moins tous les six mois
- de tenir les archives et les registres relatifs à l'immeuble et au syndicat
- d'ouvrir un compte bancaire au nom du syndicat
- de représenter le syndicat en justice

Article 26 bis: Les fonctions du syndic prennent fin dans les cas suivants:
- la démission
- l'expiration du mandat sauf s'il est renouvelé
- la révocation
- la dissolution dans le cas où le syndic est une personne morale
- le décès

Article 26 ter: Le syndic qui désire démissionner doit en informer préalablement tous les propriétaires et les inviter à une assemblée générale tenue dans un délai de trente (30) jours.

Article 27: En cas de décès du syndic, de sa révocation ou de sa démission, le syndic adjoint exerce les mêmes attributions que le syndic.

Article 28: Le syndic ou son adjoint doivent présenter un rapport sur le bilan de leurs activités à l'assemblée générale. A l'expiration de sa mission, le syndic est tenu de remettre à son successeur tous les documents, archives, registres du syndicat et de l'immeuble, la situation de trésorerie et tous les biens du syndicat y compris les liquidités.

Article 30: Dans un délai maximum de huit jours suivant la date de prise des décisions par l'assemblée générale, le syndic doit notifier à tous les copropriétaires les décisions accompagnées des procès-verbaux de réunions. La notification est effectuée par lettre recommandée avec accusé de réception, par huissier de justice ou par tout moyen légal de notification.

Des droits et des obligations des copropriétaires

Article 31: Tout copropriétaire a le droit d'user, d'exploiter et de disposer de la partie divise qui lui revient dans l'immeuble selon son affectation.

Article 33: Le copropriétaire, ses ayants droit ou l'occupant ne doivent pas interdire les travaux relatifs aux parties indivises décidés par l'assemblée générale même s'ils se réalisent à l'intérieur des parties divises.

Article 36: Chacun des copropriétaires est tenu de participer aux charges relatives à la conservation, l'entretien et la gestion des parties communes. Chaque copropriétaire doit également participer aux charges des services collectifs relatifs à la gestion de la copropriété et des équipements communs selon l'utilité de ces services et équipements pour chaque partie divise.

Article 36 bis: Au cas où l'un des copropriétaires ne s'acquitte pas du paiement des charges et dépenses décidées par le syndicat dans le délai déterminé, le président du tribunal de première instance prononce une ordonnance d'injonction de payer dans un délai ne dépassant pas trois (3) mois.

Article 37 bis: Un compte de réserve peut être créé pour couvrir les dépenses inhabituelles ou urgentes. Il est approvisionné périodiquement par tous les copropriétaires. En cas d'urgence, le syndic peut utiliser le compte de réserve, à condition d'en informer chaque copropriétaire par écrit.

Article 40: Les créances du syndicat à l'égard de l'un de ses membres bénéficient de l'hypothèque forcée sur sa partie privative et sa quote-part dans les parties indivises.

Article 42: En cas de cession d'une partie divise, le cessionnaire est solidairement responsable avec le cédant à l'égard du syndicat pour le paiement des créances.

Article 43: Les créances du syndicat relatives aux charges communes à l'encontre des copropriétaires sont prescrites dans les cinq (5) ans à compter de leur approbation par l'assemblée générale.

Article 45: En cas de destruction totale de l'immeuble, la décision de reconstruction est prise à l'unanimité des copropriétaires. En cas de destruction partielle, la décision est prise à la majorité des trois quarts des voix.

Chapitre V bis — Les procédures de traitement des difficultés de gestion de la copropriété

Article 59 bis: Lorsque le syndicat des copropriétaires est incapable de s'acquitter des dettes exigibles ou de conserver la copropriété, le président du tribunal de première instance, statuant en référé, peut désigner un administrateur provisoire à la demande du syndic ou de 10% de l'ensemble des copropriétaires.

Article 59 ter: L'ordonnance du président du tribunal fixe la mission de l'administrateur provisoire et sa durée qui ne doit pas dépasser une année.

Article 59 quater: L'administrateur provisoire prend les mesures susceptibles de redresser la situation de la copropriété. Il est investi des mêmes pouvoirs que le syndic.

Article 59 undecies: Le tribunal de première instance du lieu de la copropriété est compétent pour statuer sur tout litige se rapportant à l'application des dispositions de la présente loi.

Article 59 duodecies: Les recours contre les décisions de l'assemblée générale doivent être introduits dans un délai de deux mois à compter de la date de leur notification.

Dispositions finales — Article 4 de la Loi 106-12: Les copropriétaires des immeubles bâtis avant l'entrée en vigueur de la présente loi sont tenus d'adapter le règlement de copropriété à ses dispositions. A défaut d'adaptation, les clauses en contradiction avec les dispositions de la présente loi sont réputées nulles.
`
}

export const ALL_DOCUMENTS: DocumentSource[] = [IQAMATI_STORY, MOROCCAN_LAW]
