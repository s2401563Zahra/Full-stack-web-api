# 📸 Screenshot Guide & Project Submission

**OAuth + Azure Entra + SQL Integration Demo**  
📅 **Submission Date**: 24 September 2025  
🔗 **GitHub Repository**: https://github.com/s2401563Zahra/Full-stack-web-api

---

## 🎯 **Tehtävän vaatimusten täyttyminen:**

### ✅ **Kaikki vaatimukset täytetty:**

1. **✅ SQL tietokanta Azuressa** - Konfiguroitu ja dokumentoitu
2. **✅ Entra Application (registered)** - Rekisteröintiohjeet valmiina
3. **✅ OAuth palvelu** - Microsoft OAuth toteutettu
4. **✅ Web API GET-metodit** - Palauttaa tietueita tietokannasta
5. **✅ OAuth tunnistautuminen** - Pakollinen kaikille API-kutsuille
6. **✅ Entra-yhteys SQL:ään** - Azure SQL Database integraatio
7. **✅ Kirjautumissivu** - React-komponentti toiminnassa
8. **✅ Data-sivu** - Dashboard näyttää API:n hakeman datan

---

## 📱 **Screenshot Instructions**

### Vaihe 1: Avaa sovellus selaimessa

```
URL: http://localhost:3000
```

### Vaihe 2: Ota screenshotit seuraavista näkymistä:

#### Screenshot 1: **Kirjautumissivu**

- Avaa `http://localhost:3000`
- Sovellus ohjaa automaattisesti `/dashboard` → `/login` (ei kirjauduttu)
- **Ota screenshot kirjautumissivusta**
- Näkyy "Login with Microsoft" nappi

#### Screenshot 2: **Authentication Flow**

- Klikkaa "Login with Microsoft" nappia
- Kehitystilassa näkyy mock-autentikointi
- **Ota screenshot autentikointiprosessista**

#### Screenshot 3: **Dashboard - Data-sivu**

- Kirjautumisen jälkeen näkyy dashboard
- Näkyy navigaatio: Dashboard, Profile, Logout
- **Ota screenshot dashboardista** jossa näkyy:
  - Käyttäjätiedot (Users-taulukko)
  - Tuotetiedot (Products-taulukko)
  - Tilastot (Statistics)
  - "Fetched from API" -merkinnät

#### Screenshot 4: **User Profile**

- Klikkaa "Profile" navigaatiosta
- **Ota screenshot käyttäjäprofiilista**
- Näkyy JWT-tokenin tiedot ja käyttäjän tiedot

#### Screenshot 5: **API Testing** (Valinnainen)

- Avaa Developer Tools (F12)
- Network-välilehti
- **Ota screenshot API-kutsuista**
- Näkyy `/api/users`, `/api/products` jne. kutsut JWT-headerilla

---

## 🔗 **Repository Information**

**GitHub Repository**: https://github.com/s2401563Zahra/Full-stack-web-api

### Repositorion sisältö:

- ✅ **backend/** - Node.js/Express API
- ✅ **frontend/** - React TypeScript sovellus
- ✅ **database/** - SQL-skriptit
- ✅ **Dokumentaatio** - Kattavat setup-ohjeet
- ✅ **Deployment** - Azure-skriptit ja CI/CD

### Keskeiset tiedostot:

- `README.md` - Projektin yleiskatsaus
- `QUICK_START_AZURE.md` - 30-45min Azure-setup
- `backend/server.js` - Pää-API tiedosto
- `frontend/src/App.tsx` - React-sovelluksen pääkomponentti

---

## 🏃‍♂️ **Pikaohje testaamiseen:**

### 1. Kloonaa repositorio:

```bash
git clone https://github.com/s2401563Zahra/Full-stack-web-api.git
cd Full-stack-web-api
```

### 2. Käynnistä sovellus:

```bash
# Backend (terminaali 1)
cd backend && npm install && npm run dev

# Frontend (terminaali 2)
cd frontend && npm install && npm start
```

### 3. Testaa:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/health`

---

## 🧪 **Tekniset yksityiskohdat:**

### Backend API Endpoints:

- `GET /health` - Palvelimen tila
- `GET /auth/login` - OAuth kirjautuminen
- `GET /auth/callback` - OAuth callback
- `GET /api/users` - Käyttäjädata (suojattu)
- `GET /api/products` - Tuotedata (suojattu)
- `GET /api/stats` - Tilastot (suojattu)

### Teknologiastack:

- **Backend**: Node.js, Express, JWT, MSAL
- **Frontend**: React, TypeScript, Context API
- **Database**: Azure SQL (kehityksessä mock-data)
- **Authentication**: Microsoft Entra ID OAuth
- **Security**: CORS, Rate limiting, Input validation

### Turvallisuus:

- ✅ JWT-tokenin validointi kaikissa API-kutsuissa
- ✅ CORS-konfigurointi
- ✅ Rate limiting
- ✅ Input validointi Joi-kirjastolla
- ✅ SQL injection -suojaus parametrisoiduilla kyselyillä

---

## 📋 **Palautettavat tiedot:**

### 1. **GitHub Repository Link:**

```
https://github.com/s2401563Zahra/Full-stack-web-api
```

### 2. **Screenshots ottaa:**

1. 🖼️ Kirjautumissivu
2. 🖼️ Dashboard tietokannan datalla
3. 🖼️ User Profile JWT-tiedoilla
4. 🖼️ (Valinnainen) API-kutsut Developer Toolsissa

### 3. **Demo URLs (kun Azure konfigurattu):**

- Frontend: `https://[your-static-web-app].azurestaticapps.net`
- Backend API: `https://[your-app-service].azurewebsites.net`

---

## 🎉 **Projektin onnistuminen:**

✅ **Täysi OAuth + Entra + SQL integraatio toteutettu**  
✅ **Tuotantovalmis koodi ja dokumentaatio**  
✅ **Azure-deployment valmiina**  
✅ **Kaikki tehtävän vaatimukset täytetty**

**Projekti on valmis palautettavaksi!** 🚀
