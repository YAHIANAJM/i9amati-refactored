export function Privacy() {
  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Politique de Confidentialité</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>Dernière mise à jour : {new Date().getFullYear()}</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>1. Collecte des données</h2>
      <p>IQAMATI collecte uniquement les informations nécessaires au fonctionnement de la plateforme de gestion syndic : nom, adresse e-mail, et informations relatives aux résidences gérées.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>2. Utilisation des données</h2>
      <p>Vos données sont utilisées exclusivement pour :</p>
      <ul>
        <li>L'authentification et la gestion de votre compte</li>
        <li>La gestion des résidences, appartements et membres</li>
        <li>L'envoi de convocations et notifications liées à votre syndic</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>3. Partage des données</h2>
      <p>Nous ne vendons ni ne partageons vos données personnelles avec des tiers, sauf obligation légale.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>4. Connexion via réseaux sociaux</h2>
      <p>Si vous utilisez la connexion via Google ou Facebook, nous accédons uniquement à votre nom et adresse e-mail publics pour créer votre compte IQAMATI. Nous ne publions rien en votre nom.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>5. Sécurité</h2>
      <p>Vos données sont stockées de manière sécurisée sur des serveurs hébergés en Europe. Les mots de passe sont chiffrés et ne sont jamais stockés en clair.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>6. Vos droits</h2>
      <p>Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données à tout moment en nous contactant à <strong>support@iqamati.com</strong>.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>7. Contact</h2>
      <p>Pour toute question relative à vos données : <strong>support@iqamati.com</strong></p>
    </div>
  )
}
