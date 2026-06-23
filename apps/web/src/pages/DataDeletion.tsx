export function DataDeletion() {
  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Suppression de vos données</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>Instructions pour la suppression de votre compte et de vos données personnelles</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>Comment supprimer vos données</h2>
      <p>Si vous avez utilisé la connexion via Facebook ou Google pour créer un compte IQAMATI, vous pouvez demander la suppression complète de vos données selon l'une des méthodes suivantes :</p>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24 }}>Option 1 — Depuis votre compte</h3>
      <ol>
        <li>Connectez-vous à <strong>iqamati.com</strong></li>
        <li>Accédez à <strong>Paramètres → Compte</strong></li>
        <li>Cliquez sur <strong>"Supprimer mon compte"</strong></li>
        <li>Confirmez la suppression</li>
      </ol>
      <p>Toutes vos données personnelles seront supprimées dans un délai de <strong>30 jours</strong>.</p>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24 }}>Option 2 — Par e-mail</h3>
      <p>Envoyez un e-mail à <strong>support@iqamati.com</strong> avec :</p>
      <ul>
        <li>Objet : <strong>"Suppression de données"</strong></li>
        <li>Votre adresse e-mail associée au compte</li>
        <li>Votre nom</li>
      </ul>
      <p>Nous traiterons votre demande dans un délai de <strong>72 heures</strong> et vous enverrons une confirmation.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32 }}>Ce qui sera supprimé</h2>
      <ul>
        <li>Votre profil et informations personnelles</li>
        <li>Votre historique de connexion</li>
        <li>Toutes les données associées à votre compte</li>
      </ul>

      <p style={{ marginTop: 32, color: '#64748b', fontSize: 14 }}>
        Pour toute question : <strong>support@iqamati.com</strong>
      </p>
    </div>
  )
}
