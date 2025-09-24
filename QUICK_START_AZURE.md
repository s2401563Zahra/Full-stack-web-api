# Quick Start Guide - Azure Configuration

Tämä on nopea aloitusopas Azure-palveluiden konfigurointiin kehityskäyttöön.

## Vaihe 1: Azure SQL Database (15-20 min)

### Luo Azure SQL Server ja tietokanta

1. **Azure Portal** → "SQL databases" → "+ Create"
2. **Server**: Luo uusi server Microsoft Entra ID -autentikoinnilla
3. **Database name**: `oauth-entra-database`
4. **Pricing**: Basic (kehityskäyttöön)

### Konfiguroi verkko

1. **Networking** → Allow Azure services ✅
2. **Firewall**: Lisää oma IP-osoitteesi
3. **Connection strings**: Kopioi talteen

### Luo taulut

1. Lataa [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio)
2. Yhdistä tietokantaan Azure AD -autentikoinnilla
3. Suorita `database/setup.sql` skripti

## Vaihe 2: Microsoft Entra ID App Registration (10-15 min)

### Rekisteröi sovellus

1. **Azure Portal** → "Microsoft Entra ID" → "App registrations" → "+ New registration"
2. **Name**: `OAuth Entra SQL Demo App`
3. **Redirect URI**: `http://localhost:3001/auth/callback` (Web)

### Konfiguroi autentikointi

1. **Certificates & secrets** → Luo uusi client secret → **Kopioi heti talteen!**
2. **API permissions** → Microsoft Graph → `openid`, `profile`, `email`, `User.Read`
3. **Authentication** → Lisää frontend URI: `http://localhost:3000` (SPA)

### Kopioi tiedot

- **Application (client) ID**
- **Directory (tenant) ID**
- **Client secret** (kopioitu aiemmin)

## Vaihe 3: Ympäristömuuttujien päivitys (5 min)

### Backend (.env)

```bash
# Korvaa placeholder-arvot oikeilla tiedoilla
NODE_ENV=production
AZURE_CLIENT_ID=your_application_client_id_here
AZURE_CLIENT_SECRET=your_client_secret_here
AZURE_TENANT_ID=your_directory_tenant_id_here
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=oauth-entra-database
```

### Frontend (ei muutoksia tarvita kehityksessä)

Frontend käyttää backendin API:a autentikointiin.

## Vaihe 4: Testaus (5 min)

### Käynnistä sovellus

```bash
# Terminaali 1: Backend
cd backend && npm run dev

# Terminaali 2: Frontend
cd frontend && npm start
```

### Testaa kirjautuminen

1. Avaa `http://localhost:3000`
2. Klikkaa "Login"
3. Kirjaudu Microsoft-tilillä
4. Tarkista että pääset dashboardiin ja näet tietokannasta haettua dataa

## Vaihe 5: SQL-käyttöoikeuksien myöntäminen

### Anna sovellukselle tietokanta-oikeudet

Azure Data Studiossa:

```sql
-- Luo contained database user sovellukselle
CREATE USER [OAuth Entra SQL Demo App] FROM EXTERNAL PROVIDER;

-- Myönnä oikeudet
EXEC sp_addrolemember 'db_datareader', 'OAuth Entra SQL Demo App';
EXEC sp_addrolemember 'db_datawriter', 'OAuth Entra SQL Demo App';
```

## Vianmääritys - Pikaohjeet

### "invalid_client_credential" virhe

- Tarkista että AZURE_CLIENT_SECRET on asetettu oikein
- Varmista että client secret ei ole vanhentunut

### "Connection timeout" tietokantaan

- Tarkista SQL Server firewall-säännöt
- Varmista että IP-osoitteesi on sallittu

### "CORS error" selaimessa

- Tarkista että CORS_ORIGIN on asetettu oikein backendissa
- Varmista että frontend pyörii portissa 3000

### "Redirect URI mismatch"

- Tarkista että redirect URI:t täsmäävät Entra ID:ssä
- Backend: `http://localhost:3001/auth/callback`
- Frontend: `http://localhost:3000`

## Seuraavat vaiheet

Kun paikallinen kehitys toimii:

1. 📚 Lue [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) tuotantoon siirtymiseen
2. 🔐 Konfiguroi turvallisemmat ympäristömuuttujat
3. 🚀 Deploy Azure App Serviceen ja Static Web Appsiin

## Apua tarvitset?

- **Yksityiskohtaiset ohjeet**: [AZURE_SQL_SETUP.md](./AZURE_SQL_SETUP.md)
- **Entra ID konfigurointi**: [ENTRA_ID_SETUP.md](./ENTRA_ID_SETUP.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Projektin yleiskatsaus**: [README.md](./README.md)

**Kokonaisaika**: ~30-45 minuuttia ensimmäisellä kerralla 🕐
