# Azure Deployment Guide

Tämä opas auttaa sinua deployaamaan OAuth + Entra + SQL sovelluksen Azure-pilvipalveluun.

## Osa 1: Deployment-strategian valinta

### Suositellut Azure-palvelut:

**Backend API**:

- Azure App Service (Web App) - Suositeltu
- Azure Container Apps - Konttipohjainen ratkaisu
- Azure Functions - Serverless-ratkaisu

**Frontend React App**:

- Azure Static Web Apps - Suositeltu React-sovelluksille
- Azure App Service - Perinteinen hosting
- Azure Storage + CDN - Staattinen hosting

**Tietokanta**:

- Azure SQL Database - Jo konfiguroitu

## Osa 2: Backend Deployment (Azure App Service)

### 2.1 App Service -luominen

1. Azure Portalissa hae "App Services"
2. Klikkaa "+ Create"
3. Täytä tiedot:
   - **Resource Group**: Käytä samaa kuin SQL-tietokannalle
   - **Name**: `oauth-entra-api` (tai muu uniikki nimi)
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Sama kuin SQL-tietokanta
   - **Pricing plan**: F1 (Free tier kehitykseen)

### 2.2 Deployment-konfigurointi

1. App Service luomisen jälkeen, mene "Deployment Center" -sivulle
2. Valitse deployment-lähde:
   - **GitHub**: Jos koodi on GitHubissa
   - **Local Git**: Paikallinen git push
   - **VS Code**: Suora deployment VS Codesta

### 2.3 Ympäristömuuttujien asettaminen

1. App Servicessa, valitse "Configuration"
2. Lisää "Application settings":
   ```
   NODE_ENV=production
   PORT=8000
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret
   AZURE_TENANT_ID=your_tenant_id
   AZURE_REDIRECT_URI=https://oauth-entra-api.azurewebsites.net/auth/callback
   JWT_SECRET=your_production_jwt_secret_min_32_chars
   JWT_EXPIRATION=1h
   SQL_SERVER=your-sql-server.database.windows.net
   SQL_DATABASE=oauth-entra-database
   CORS_ORIGIN=https://oauth-entra-frontend.azurewebsites.net
   ```

### 2.4 Build ja deployment-skriptit

Lisää `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step needed for Node.js'",
    "postinstall": "echo 'Backend dependencies installed'"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

## Osa 3: Frontend Deployment (Azure Static Web Apps)

### 3.1 Static Web App -luominen

1. Azure Portalissa hae "Static Web Apps"
2. Klikkaa "+ Create"
3. Täytä tiedot:
   - **Resource Group**: Sama kuin backend
   - **Name**: `oauth-entra-frontend`
   - **Plan type**: Free
   - **Region**: West Europe 2
   - **Source**: GitHub (yhdistä GitHub-repositorio)
   - **Build presets**: React
   - **App location**: `/frontend`
   - **Output location**: `build`

### 3.2 Frontend build-konfigurointi

Luo `frontend/.env.production`:

```bash
REACT_APP_API_URL=https://oauth-entra-api.azurewebsites.net
REACT_APP_NAME=OAuth + Azure Entra + SQL Demo
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### 3.3 Build-skriptin varmistaminen

Varmista `frontend/package.json`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

## Osa 4: Azure DevOps tai GitHub Actions CI/CD

### 4.1 GitHub Actions (Suositeltu)

Luo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy-backend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: "oauth-entra-api"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: "./backend"

  build-and-deploy-frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install and build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          output_location: "build"
```

### 4.2 Secrets-konfigurointi

GitHub repositoryssä, Settings > Secrets and variables > Actions:

- `AZURE_WEBAPP_PUBLISH_PROFILE`: Lataa App Servicesta
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Kopioi Static Web Appista

## Osa 5: Tuotannon tietoturva

### 5.1 App Service Security

1. **HTTPS Only**: Pakota HTTPS-yhteydet
2. **Minimum TLS Version**: 1.2
3. **Authentication**: Konfiguroi Azure AD -integraatio

### 5.2 SQL Database Security

1. **Firewall**: Salli vain Azure Services ja määritetyt IP:t
2. **Encryption**: Transparent Data Encryption käytössä
3. **Auditing**: Kytke päälle audit-lokit

### 5.3 Key Vault -integraatio

1. Luo Azure Key Vault
2. Siirrä salaisuudet (secrets) Key Vaultiin
3. Konfiguroi App Service käyttämään Key Vaultia

```bash
# Esimerkki Key Vault -arvoista
JWT_SECRET -> KeyVault: "jwt-secret"
AZURE_CLIENT_SECRET -> KeyVault: "azure-client-secret"
```

## Osa 6: Monitoring ja Logging

### 6.1 Application Insights

1. Luo Application Insights -resurssi
2. Lisää instrumentation key App Serviceen
3. Lisää backend-koodiin:

```javascript
const appInsights = require("applicationinsights");
appInsights.setup().start();
```

### 6.2 Log Analytics

1. Kytke App Service logs päälle
2. Konfiguroi Log Analytics workspace
3. Seuraa virheitä ja performanssia

## Osa 7: Custom Domain ja SSL

### 7.1 Custom Domain -lisääminen

1. App Servicessa, valitse "Custom domains"
2. Lisää oma domain (esim. api.yourdomain.com)
3. Konfiguroi DNS-asetukset

### 7.2 SSL Certificate

1. Azure tarjoaa ilmaisen App Service Managed Certificate
2. Tai tuo oma wildcard-sertifikaatti
3. Pakota HTTPS-yhteydet

## Osa 8: Vianmääritys ja Optimointi

### 8.1 Yleiset ongelmat:

1. **Startup errors**: Tarkista Application logs
2. **Environment variables**: Varmista kaikki muuttujat asetettu
3. **CORS issues**: Päivitä CORS_ORIGIN production URL:iin
4. **Database connection**: Tarkista firewall ja authentication

### 8.2 Performance-optimointi:

1. **App Service Plan**: Skaalaa tarvittaessa
2. **CDN**: Käytä Azure CDN staattisille tiedostoille
3. **Caching**: Implementoi Redis Cache tarvittaessa
4. **Database**: Optimoi queries ja indexes

## Osa 9: Backup ja Disaster Recovery

### 9.1 Automaattiset varmuuskopiot:

1. **App Service**: Konfiguroi automaattiset backupit
2. **SQL Database**: Point-in-time restore käytössä
3. **Static Web App**: Koodi GitHubissa = automaattinen backup

### 9.2 Multi-region deployment:

1. **Traffic Manager**: Jakele liikennettä useille alueille
2. **Geo-replication**: SQL Database replica toisella alueella
3. **CDN**: Globaali sisällönjakeluverkko

## Deployment Checklist

Ennen tuotantoon siirtymistä:

### Pakollisia:

- [ ] Azure SQL Database luotu ja konfiguroitu
- [ ] Microsoft Entra ID sovellus rekisteröity
- [ ] App Service luotu ja konfiguroitu
- [ ] Static Web App luotu ja konfiguroitu
- [ ] Ympäristömuuttujat asetettu tuotantoon
- [ ] HTTPS pakotettu käyttöön
- [ ] Firewall-säännöt konfiguroitu

### Suositeltavia:

- [ ] Application Insights käytössä
- [ ] Key Vault salaisuuksille
- [ ] Automaattiset backupit
- [ ] CI/CD pipeline GitHub Actionsilla
- [ ] Custom domain ja SSL
- [ ] Performance monitoring

### Turvallisuus:

- [ ] Kaikki default-salasanat vaihdettu
- [ ] Kehitystilakoodi poistettu
- [ ] Error handling ei paljasta sisäistä tietoa
- [ ] Rate limiting käytössä
- [ ] Input validation kaikilla endpointeilla

Kun kaikki on valmista, sovelluksesi on turvallisesti deployattu Azure-pilvipalveluun! 🚀
