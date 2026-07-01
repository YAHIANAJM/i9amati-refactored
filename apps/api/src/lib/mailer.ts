import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface ConvocationEmailOpts {
  to: string
  recipientName: string
  meetingTitle: string
  meetingDate: Date
  meetingLocation: string | null
  agendaItems: { title: string; description?: string }[]
}

// ─── Shared HTML shell ────────────────────────────────────────────────────────

function emailShell(headerColor: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
    <div style="background:${headerColor};padding:24px 28px">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">IQAMATI</p>
      <p style="margin:4px 0 0;color:${accentColor};font-size:13px">Plateforme de gestion syndic</p>
    </div>
    <div style="padding:28px">${body}</div>
  </div>
</body>
</html>`
}

const FOOTER = `<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px">
  Cet email a été envoyé via la plateforme IQAMATI.<br>
  Si vous pensez avoir reçu cet email par erreur, ignorez-le.
</p>`

// ─── Delegate invitation ──────────────────────────────────────────────────────

interface DelegateInvitationOpts {
  to: string
  recipientName: string
  building: string
  syndicName: string
  note?: string
}

export async function sendDelegateInvitationEmail(opts: DelegateInvitationOpts): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — skipping delegate invitation to', opts.to)
    return false
  }

  const transport = createTransport()
  await transport.sendMail({
    from: `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `[IQAMATI] Vous avez été désigné délégué d'immeuble`,
    html: emailShell('#1e3a8a', '#93c5fd', `
      <p style="margin:0 0 16px;color:#1e293b">Bonjour <strong>${opts.recipientName}</strong>,</p>
      <p style="margin:0 0 20px;color:#475569">
        Le syndic <strong>${opts.syndicName}</strong> vous a désigné comme
        <strong>délégué d'immeuble</strong> pour l'immeuble suivant&nbsp;:
      </p>

      <div style="background:#eff6ff;border-left:4px solid #1e3a8a;padding:18px 20px;border-radius:0 8px 8px 0;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#1e3a8a">🏢 ${opts.building}</p>
        <p style="margin:0;font-size:13px;color:#3b82f6">Délégué désigné par ${opts.syndicName}</p>
      </div>

      ${opts.note ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Note du syndic</p>
        <p style="margin:0;font-size:14px;color:#334155">${opts.note}</p>
      </div>` : ''}

      <p style="margin:0 0 8px;color:#475569;font-size:14px">
        En tant que délégué, vous serez l'interface entre les résidents et le syndic pour cet immeuble.
        Vos responsabilités peuvent inclure la collecte des charges, la gestion des réclamations quotidiennes
        et la coordination des interventions.
      </p>
      <p style="margin:0;color:#475569;font-size:14px">
        Connectez-vous à IQAMATI pour accéder à votre espace délégué.
      </p>
      ${FOOTER}
    `),
  })
  return true
}

// ─── Partner syndic invitation ────────────────────────────────────────────────

interface PartnerInvitationOpts {
  to: string
  recipientName: string
  residence: string
  sharedParts: string[]
  syndicName: string
  syndicResidence: string
  note?: string
}

export async function sendPartnerInvitationEmail(opts: PartnerInvitationOpts): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — skipping partner invitation to', opts.to)
    return false
  }

  const partsHtml = opts.sharedParts
    .map(p => `<span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:3px 10px;border-radius:100px;margin:3px 3px 0 0">${p}</span>`)
    .join('')

  const transport = createTransport()
  await transport.sendMail({
    from: `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `[IQAMATI] Invitation de partenariat syndic`,
    html: emailShell('#064e3b', '#6ee7b7', `
      <p style="margin:0 0 16px;color:#1e293b">Bonjour <strong>${opts.recipientName}</strong>,</p>
      <p style="margin:0 0 20px;color:#475569">
        Le syndic <strong>${opts.syndicName}</strong> (${opts.syndicResidence}) souhaite établir un
        <strong>partenariat</strong> avec votre résidence pour la gestion des parties communes partagées.
      </p>

      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:18px 20px;border-radius:0 8px 8px 0;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#15803d">🤝 ${opts.syndicResidence} × ${opts.residence}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#166534">Parties communes concernées&nbsp;:</p>
        <div>${partsHtml}</div>
      </div>

      ${opts.note ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Message du syndic</p>
        <p style="margin:0;font-size:14px;color:#334155">${opts.note}</p>
      </div>` : ''}

      <p style="margin:0;color:#475569;font-size:14px">
        Pour confirmer ce partenariat et coordonner la gestion de ces espaces communs,
        contactez le syndic ${opts.syndicName} ou connectez-vous à IQAMATI.
      </p>
      ${FOOTER}
    `),
  })
  return true
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: { to: string; name: string; resetUrl: string }): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — skipping password reset ', opts)
    return false
  }

  const transport = createTransport()
  await transport.sendMail({
    from: `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `[IQAMATI] Réinitialisation de votre mot de passe`,
    html: emailShell('#1e3a8a', '#93c5fd', `
      <p style="margin:0 0 16px;color:#1e293b">Bonjour <strong>${opts.name}</strong>,</p>
      <p style="margin:0 0 20px;color:#475569">
        Vous avez demandé la réinitialisation de votre mot de passe IQAMATI.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe&nbsp;:
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${opts.resetUrl}"
           style="display:inline-block;background:#1e3a8a;color:#fff;font-size:14px;font-weight:600;
                  padding:13px 32px;border-radius:100px;text-decoration:none;letter-spacing:0.3px">
          Réinitialiser le mot de passe
        </a>
      </div>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center">
        Ce lien est valable pendant 1 heure.
      </p>
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>
      ${FOOTER}
    `),
  })
  return true
}

// ─── Magic link ───────────────────────────────────────────────────────────────

export async function sendMagicLinkEmail(opts: { to: string; magicUrl: string }): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — skipping magic link to', opts.to)
    return false
  }

  const transport = createTransport()
  await transport.sendMail({
    from: `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `[IQAMATI] Votre lien de connexion`,
    html: emailShell('#0f172a', '#94a3b8', `
      <p style="margin:0 0 16px;color:#1e293b">Bonjour,</p>
      <p style="margin:0 0 20px;color:#475569">
        Cliquez sur le bouton ci-dessous pour vous connecter à IQAMATI.
        Ce lien est à usage unique.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${opts.magicUrl}"
           style="display:inline-block;background:#0f172a;color:#fff;font-size:14px;font-weight:600;
                  padding:13px 32px;border-radius:100px;text-decoration:none;letter-spacing:0.3px">
          Se connecter
        </a>
      </div>
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
        Ce lien expire dans 5 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
      ${FOOTER}
    `),
  })
  return true
}

// ─── Convocation ──────────────────────────────────────────────────────────────

export async function sendConvocationEmail(opts: ConvocationEmailOpts): Promise<void> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Mailer] SMTP not configured — skipping email to', opts.to)
    return
  }

  const dateStr = new Intl.DateTimeFormat('fr-MA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Casablanca',
  }).format(opts.meetingDate)

  const agendaHtml = opts.agendaItems.length
    ? opts.agendaItems.map((item, i) =>
      `<li style="margin-bottom:8px"><strong>${i + 1}. ${item.title}</strong>${item.description ? `<br><span style="color:#64748b;font-size:13px">${item.description}</span>` : ''
      }</li>`
    ).join('')
    : '<li style="color:#94a3b8">Aucun point à l\'ordre du jour</li>'

  const transport = createTransport()
  await transport.sendMail({
    from: `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `[IQAMATI] Convocation — ${opts.meetingTitle}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
    <div style="background:#1e3a8a;padding:24px 28px">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">IQAMATI</p>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px">Plateforme de gestion syndic</p>
    </div>

    <div style="padding:28px">
      <p style="margin:0 0 16px;color:#1e293b">Bonjour <strong>${opts.recipientName}</strong>,</p>
      <p style="margin:0 0 20px;color:#475569">Vous êtes convoqué(e) à la réunion de copropriété suivante&nbsp;:</p>

      <div style="background:#eff6ff;border-left:4px solid #1e3a8a;padding:18px 20px;border-radius:0 8px 8px 0;margin-bottom:24px">
        <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1e3a8a">${opts.meetingTitle}</p>
        <p style="margin:4px 0;font-size:14px;color:#334155">📅 ${dateStr}</p>
        ${opts.meetingLocation ? `<p style="margin:4px 0;font-size:14px;color:#334155">📍 ${opts.meetingLocation}</p>` : ''}
      </div>

      <h4 style="margin:0 0 12px;color:#334155;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;padding-bottom:8px">
        Ordre du jour
      </h4>
      <ol style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7">
        ${agendaHtml}
      </ol>

      <p style="margin:0;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px">
        Cette convocation est émise conformément à la loi 18-00 relative au statut de la
        copropriété des immeubles bâtis au Maroc (art.&nbsp;25 et suivants).<br>
        Merci de vous connecter à IQAMATI pour confirmer votre présence.
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}
