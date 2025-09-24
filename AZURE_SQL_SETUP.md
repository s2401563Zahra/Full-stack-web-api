# Azure SQL Database Setup Guide

Tämä opas auttaa sinua konfiguroimaan Azure SQL -tietokannan OAuth + Entra + SQL sovellukselle.

## Osa 1: Azure SQL -palvelimen ja tietokannan luominen

### 1.1 Azure Portal -kirjautuminen

1. Kirjaudu [Azure Portal](https://portal.azure.com) -palveluun
2. Varmista, että sinulla on aktiivinen Azure-tilaus

### 1.2 SQL Server -luominen

1. Hae "SQL servers" Azure Portalista
2. Klikkaa "+ Create"
3. Täytä seuraavat tiedot:
   - **Server name**: `oauth-entra-sql-server` (tai muu uniikki nimi)
   - **Resource group**: Luo uusi tai valitse olemassa oleva
   - **Location**: Valitse lähin alue (esim. West Europe)
   - **Authentication method**: Valitse "Use Microsoft Entra-only authentication"
   - **Microsoft Entra admin**: Valitse itsesi admin-käyttäjäksi

### 1.3 Tietokannan luominen

1. Kun palvelin on luotu, mene palvelimen sivulle
2. Klikkaa "+ Create database"
3. Täytä tiedot:
   - **Database name**: `oauth-entra-database`
   - **Compute + storage**: Valitse "Basic" kehityskäyttöön
   - **Backup storage redundancy**: Local-redundant backup storage

## Osa 2: Verkkoyhteyksien konfigurointi

### 2.1 Palomuurisääntöjen lisääminen

1. Mene SQL server -sivulle
2. Valitse "Networking" vasemmasta valikosta
3. **Public network access**: Valitse "Selected networks"
4. **Firewall rules**: Lisää seuraavat säännöt:
   ```
   Rule name: AllowLocalDevelopment
   Start IP: [Sinun IP-osoitteesi]
   End IP: [Sinun IP-osoitteesi]
   ```
5. **Exceptions**: Rastita "Allow Azure services and resources to access this server"

### 2.2 IP-osoitteen selvittäminen

Selvitä IP-osoitteesi komennolla:

```bash
curl -s https://api.ipify.org
```

## Osa 3: Tietokantataulujen luominen

### 3.1 Azure Data Studio asennus (suositeltu)

1. Lataa [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio)
2. Asenna sovellus

### 3.2 Yhteyden muodostaminen

1. Avaa Azure Data Studio
2. Klikkaa "New Connection"
3. Täytä tiedot:
   - **Connection type**: Microsoft SQL Server
   - **Server**: `oauth-entra-sql-server.database.windows.net`
   - **Authentication type**: Azure Active Directory - Universal with MFA support
   - **Account**: Kirjaudu Azure-tilillesi
   - **Database**: `oauth-entra-database`

### 3.3 Taulujen luominen

Suorita `database/setup.sql` tiedoston sisältö Azure Data Studiossa:

```sql
-- Käyttäjätaulu
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    azure_object_id NVARCHAR(255) UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    display_name NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    last_login DATETIME2,
    is_active BIT DEFAULT 1
);

-- Tuotetaulu
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10,2) NOT NULL,
    category NVARCHAR(100),
    stock_quantity INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    is_active BIT DEFAULT 1
);

-- Tilaustaulu
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending',
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Tilausrivit
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT FOREIGN KEY REFERENCES orders(id),
    product_id INT FOREIGN KEY REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price AS (quantity * unit_price) PERSISTED
);

-- Näytetiedot
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Laptop Computer', 'High-performance laptop for development', 1299.99, 'Electronics', 10),
('Programming Book', 'Complete guide to full-stack development', 49.99, 'Books', 25),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', 50),
('Coffee Mug', 'Programmer fuel container', 15.99, 'Accessories', 100);
```

## Osa 4: Microsoft Entra ID konfigurointi tietokantaan

### 4.1 SQL Server admin -oikeuksien varmistaminen

1. Azure Portalissa, mene SQL server -sivulle
2. Valitse "Microsoft Entra ID" vasemmasta valikosta
3. Varmista, että olet määritetty adminiksi

### 4.2 Sovelluksen käyttöoikeuksien myöntäminen

Kun Microsoft Entra ID sovellus on rekisteröity (seuraava vaihe), anna sille oikeudet tietokantaan:

```sql
-- Luo contained database user sovellukselle
CREATE USER [oauth-entra-app] FROM EXTERNAL PROVIDER;

-- Myönnä tarvittavat oikeudet
ALTER ROLE db_datareader ADD MEMBER [oauth-entra-app];
ALTER ROLE db_datawriter ADD MEMBER [oauth-entra-app];
```

## Osa 5: Ympäristömuuttujien päivitys

Kun tietokanta on valmis, päivitä `backend/.env` tiedosto:

```bash
# Azure SQL Database Configuration
SQL_SERVER=oauth-entra-sql-server.database.windows.net
SQL_DATABASE=oauth-entra-database
SQL_USERNAME=
SQL_PASSWORD=
```

**Huomio**: Kun käytät Microsoft Entra ID -autentikointia, SQL_USERNAME ja SQL_PASSWORD eivät ole tarpeen.

## Vianmääritys

### Yleisiä ongelmia:

1. **Connection timeout**: Tarkista palomuurisäännöt
2. **Authentication failed**: Varmista Entra ID -oikeudet
3. **Database not found**: Tarkista tietokannan nimi

### Testauskomennot:

```bash
# Testaa yhteys
sqlcmd -S oauth-entra-sql-server.database.windows.net -d oauth-entra-database -G

# Testaa taulut
SELECT name FROM sys.tables;
```

## Seuraavat vaiheet

Kun Azure SQL -tietokanta on konfiguroitu:

1. ✅ Tietokanta luotu ja konfiguroitu
2. 🔄 Siirry Microsoft Entra ID sovelluksen rekisteröintiin
3. 🔄 Päivitä sovelluksen ympäristömuuttujat
4. 🔄 Testaa todellinen autentikointi ja tietokantayhteys
