import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface ConvocationEmailOpts {
  to:            string
  recipientName: string
  meetingTitle:  string
  meetingDate:   Date
  meetingLocation: string | null
  agendaItems:   { title: string; description?: string }[]
}

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
        `<li style="margin-bottom:8px"><strong>${i + 1}. ${item.title}</strong>${
          item.description ? `<br><span style="color:#64748b;font-size:13px">${item.description}</span>` : ''
        }</li>`
      ).join('')
    : '<li style="color:#94a3b8">Aucun point à l\'ordre du jour</li>'

  const transport = createTransport()
  await transport.sendMail({
    from:    `"IQAMATI Syndic" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to:      opts.to,
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
