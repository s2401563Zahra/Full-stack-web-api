# Microsoft Entra ID Application Registration Guide

Tämä opas auttaa sinua rekisteröimään sovelluksen Microsoft Entra ID:ssä OAuth-autentikointia varten.

## Osa 1: Sovelluksen rekisteröinti

### 1.1 Azure Portal -navigointi

1. Kirjaudu [Azure Portal](https://portal.azure.com) -palveluun
2. Hae "Microsoft Entra ID" tai "Azure Active Directory"
3. Valitse "App registrations" vasemmasta valikosta
4. Klikkaa "+ New registration"

### 1.2 Perustiedot

Täytä sovelluksen rekisteröintilomake:

**Name**: `OAuth Entra SQL Demo App`

**Supported account types**: Valitse vaihtoehto riippuen tarpeistasi:

- "Accounts in this organizational directory only" (Single tenant) - Suositeltu kehitykseen
- "Accounts in any organizational directory" (Multi-tenant) - Tuotantokäyttöön

**Redirect URI**:

- **Platform**: Web
- **Redirect URI**: `http://localhost:3001/auth/callback`

Klikkaa "Register"

## Osa 2: Autentikoinnin konfigurointi

### 2.1 Client Secret -luominen

1. Sovelluksen sivulla, valitse "Certificates & secrets"
2. Klikkaa "+ New client secret"
3. Täytä tiedot:
   - **Description**: `OAuth Entra SQL Demo Secret`
   - **Expires**: 24 months (suositeltu kehitykseen)
4. Klikkaa "Add"
5. **TÄRKEÄ**: Kopioi secret value heti - sitä ei voi nähdä myöhemmin!

### 2.2 API Permissions -lisääminen

1. Valitse "API permissions" vasemmasta valikosta
2. Klikkaa "+ Add a permission"
3. Valitse "Microsoft Graph"
4. Valitse "Delegated permissions"
5. Lisää seuraavat käyttöoikeudet:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
6. Klikkaa "Add permissions"
7. Klikkaa "Grant admin consent for [Your Organization]" (jos olet admin)

### 2.3 Authentication -asetusten tarkistus

1. Valitse "Authentication" vasemmasta valikosta
2. Varmista seuraavat asetukset:
   - **Redirect URIs**: `http://localhost:3001/auth/callback`
   - **Front-channel logout URL**: (tyhjä kehityksessä)
   - **Implicit grant and hybrid flows**: Älä rastita mitään
   - **Allow public client flows**: No

## Osa 3: Tietojen kerääminen

### 3.1 Kopioi tärkeät tiedot

Sovelluksen "Overview" -sivulta kopioi:

1. **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. **Client secret**: (kopioitu aiemmin vaiheessa 2.1)

### 3.2 Ympäristömuuttujien päivitys

Päivitä `backend/.env` tiedosto kopioiduilla tiedoilla:

```bash
# Azure Entra ID Configuration
AZURE_CLIENT_ID=your_application_client_id_here
AZURE_CLIENT_SECRET=your_client_secret_here
AZURE_TENANT_ID=your_directory_tenant_id_here
AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

## Osa 4: Frontend-konfigurointi

### 4.1 MSAL konfigurointi

Päivitä `frontend/src/config/authConfig.ts` (jos ei ole olemassa, luo se):

```typescript
export const msalConfig = {
  auth: {
    clientId: "your_application_client_id_here",
    authority:
      "https://login.microsoftonline.com/your_directory_tenant_id_here",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};
```

### 4.2 Frontend redirect URI -lisääminen

Palaa Azure Portaliin ja lisää frontend redirect URI:

1. Sovelluksen "Authentication" -sivulla
2. Klikkaa "+ Add a platform"
3. Valitse "Single-page application"
4. Lisää URI: `http://localhost:3000`
5. Klikkaa "Configure"

## Osa 5: Tuotanto-konfigurointi

### 5.1 Tuotannon redirect URI:t

Kun deploayaat sovelluksen, lisää tuotannon URI:t:

- Backend: `https://yourdomain.com/auth/callback`
- Frontend: `https://yourdomain.com`

### 5.2 Azure SQL -yhteys sovelluksesta

Kun sovellus on rekisteröity, anna sille SQL-tietokanta-oikeudet:

```sql
-- Azure Data Studiossa tai SQL Server Management Studiossa
USE [oauth-entra-database];

-- Luo contained database user sovellukselle
CREATE USER [OAuth Entra SQL Demo App] FROM EXTERNAL PROVIDER;

-- Myönnä tarvittavat oikeudet
EXEC sp_addrolemember 'db_datareader', 'OAuth Entra SQL Demo App';
EXEC sp_addrolemember 'db_datawriter', 'OAuth Entra SQL Demo App';
EXEC sp_addrolemember 'db_ddladmin', 'OAuth Entra SQL Demo App';
```

## Osa 6: Testaus

### 6.1 Autentikoinnin testaus

1. Käynnistä sovellus: `npm run dev` (backend) ja `npm start` (frontend)
2. Avaa `http://localhost:3000`
3. Klikkaa "Login" -nappia
4. Sinun pitäisi ohjautua Microsoft-kirjautumissivulle
5. Kirjaudu sisään ja hyväksy käyttöoikeudet
6. Sinun pitäisi palata sovellukseen kirjautuneena

### 6.2 API-testaus

Testaa suojattuja API-endpointteja:

```bash
# Hanki JWT token kirjautumisen jälkeen ja testaa
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/data/users
```

## Vianmääritys

### Yleiset ongelmat:

1. **CORS errors**: Varmista että backend CORS on konfiguroitu oikein
2. **Redirect URI mismatch**: Tarkista että URI:t täsmäävät tarkalleen
3. **Invalid client**: Tarkista client ID ja secret
4. **Scope errors**: Varmista että oikeat scope:t on määritetty

### Debug-vinkkejä:

- Käytä selaimen Developer Tools Network -tabia
- Tarkista backend-lokit virheviestien osalta
- Varmista että kaikki ympäristömuuttujat on asetettu oikein

## Seuraavat vaiheet

Kun Microsoft Entra ID on konfiguroitu:

1. ✅ Sovellus rekisteröity Entra ID:ssä
2. ✅ Client secret ja käyttöoikeudet konfiguroitu
3. 🔄 Testaa todellinen OAuth-kirjautuminen
4. 🔄 Testaa tietokantayhteys Entra ID -autentikoinnilla
5. 🔄 Deploy sovellus Azure-pilvipalveluun
