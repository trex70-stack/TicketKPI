# KPI Dashboard - Installationsanleitung

## Inhaltsverzeichnis
1. [Voraussetzungen](#voraussetzungen)
2. [Installation unter Windows](#installation-unter-windows)
3. [Installation unter Linux](#installation-unter-linux)
4. [Oracle Instant Client installieren](#oracle-instant-client-installieren)
5. [Anwendung konfigurieren](#anwendung-konfigurieren)
6. [Azure AD Authentifizierung konfigurieren](#azure-ad-authentifizierung-konfigurieren)
7. [SMTP E-Mail-Service konfigurieren](#smtp-e-mail-service-konfigurieren)
8. [Benutzer einladen](#benutzer-einladen)
9. [Anwendung starten](#anwendung-starten)
10. [Produktionsbetrieb](#produktionsbetrieb)

---

## Voraussetzungen

### Erforderliche Software
- **Node.js** (Version 18 oder höher)
- **npm** (wird mit Node.js installiert)
- **Oracle Instant Client** (für Oracle-Datenbankverbindung)
- **Git** (optional, für Versionskontrolle)

### Datenbankzugriff
- Oracle-Datenbank mit CEDM-Schema
- Benutzer mit Lesezugriff auf folgende Tabellen:
  - `CS_TICKET_TICKET`
  - `CS_TICKET_PROT`
  - `CS_TICKET_TYPE`
  - `CS_TICKET_PRIORITY`
  - `ANGESTELLTER`

---

## Installation unter Windows

### Schritt 1: Node.js installieren

1. Node.js von https://nodejs.org herunterladen (LTS-Version empfohlen)
2. Installer ausführen und Standard-Einstellungen übernehmen
3. Installation prüfen:
   ```powershell
   node --version
   npm --version
   ```

### Schritt 2: Oracle Instant Client installieren

1. Von Oracle Website herunterladen: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
   - Benötigte Pakete: **Basic** und **SQL*Plus** (optional)
2. ZIP-Datei entpacken nach `C:\oracle\instantclient_19c`
3. Zur System-Umgebungsvariable `PATH` hinzufügen:
   - Systemsteuerung → System → Erweiterte Systemeinstellungen → Umgebungsvariablen
   - Bei "Systemvariablen" die Variable `PATH` bearbeiten
   - `C:\oracle\instantclient_19c` hinzufügen
4. PowerShell neu öffnen und prüfen:
   ```powershell
   where oci.dll
   ```
   Sollte den Pfad zur oci.dll anzeigen.

### Schritt 3: Anwendung installieren

```powershell
# In das Zielverzeichnis wechseln
cd C:\Apps

# Projekt kopieren oder klonen
git clone <repository-url> TicketKPI
# ODER: Projektordner direkt hineinkopieren

# In das Projektverzeichnis wechseln
cd TicketKPI

# Abhängigkeiten installieren
npm install
```

---

## Installation unter Linux

### Schritt 1: Node.js installieren

**Ubuntu/Debian:**
```bash
# Node.js Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt-get install -y nodejs

# Installation prüfen
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# Node.js Repository hinzufügen
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Node.js installieren
sudo yum install -y nodejs

# Installation prüfen
node --version
npm --version
```

### Schritt 2: Oracle Instant Client installieren

**Ubuntu/Debian:**
```bash
# Abhängigkeiten installieren
sudo apt-get install -y libaio1 wget unzip

# Oracle Instant Client herunterladen
cd /tmp
wget https://download.oracle.com/otn_software/linux/instantclient/199000/instantclient-basic-linux.x64-19.9.0.0.0dbru.zip

# Entpacken
sudo mkdir -p /opt/oracle
sudo unzip instantclient-basic-linux.x64-19.9.0.0.0dbru.zip -d /opt/oracle

# Umgebungsvariablen setzen
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_19_9:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Library-Pfad für alle Benutzer
sudo sh -c "echo /opt/oracle/instantclient_19_9 > /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig
```

**CentOS/RHEL:**
```bash
# Abhängigkeiten installieren
sudo yum install -y libaio wget unzip

# Oracle Instant Client herunterladen und installieren
cd /tmp
wget https://download.oracle.com/otn_software/linux/instantclient/199000/instantclient-basic-linux.x64-19.9.0.0.0dbru.zip

sudo mkdir -p /opt/oracle
sudo unzip instantclient-basic-linux.x64-19.9.0.0.0dbru.zip -d /opt/oracle

# Umgebungsvariablen
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_19_9:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

sudo sh -c "echo /opt/oracle/instantclient_19_9 > /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig
```

### Schritt 3: Anwendung installieren

```bash
# Zielverzeichnis erstellen
sudo mkdir -p /opt/ticketkpi
sudo chown $USER:$USER /opt/ticketkpi

# Projekt kopieren oder klonen
cd /opt/ticketkpi
git clone <repository-url> .

# Abhängigkeiten installieren
npm install
```

---

## Oracle Instant Client installieren

### Windows
1. Download von: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Paket "Basic Package" herunterladen
3. Entpacken nach `C:\oracle\instantclient_19c`
4. Pfad zur `PATH`-Umgebungsvariable hinzufügen

### Linux
1. Download von: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html
2. Paket "Basic Package" herunterladen
3. Nach `/opt/oracle` entpacken
4. `LD_LIBRARY_PATH` setzen

### Wichtig
Die Version des Instant Client muss mit der Oracle-Datenbankversion kompatibel sein. Für Oracle 19c Datenbanken funktioniert Instant Client 19c.

---

## Anwendung konfigurieren

### Konfigurationsdatei erstellen

Datei `server/database.config.json` erstellen:

```json
{
  "database": {
    "kpiType": "oracle",
    "sqlite": {
      "kpiDatabase": "./cedm_all_data.db",
      "configDatabase": "./config.db"
    },
    "oracle": {
      "user": "CEDM_READONLY",
      "password": "IHR_PASSWORT",
      "connectString": "HOST:PORT/SERVICE_NAME",
      "kpiSchema": "CEDM"
    }
  },
  "server": {
    "port": 3001
  }
}
```

### Parameter anpassen

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `user` | Oracle-Benutzername | `CEDM_READONLY` |
| `password` | Passwort | `geheim123` |
| `connectString` | Verbindung zur DB | `172.27.7.183:1521/devu` |
| `kpiSchema` | Schema mit Ticket-Daten | `CEDM` |
| `port` | Server-Port | `3001` |

### SQLite für Benutzerverwaltung

Die Benutzerverwaltung bleibt in SQLite. Die Datei `config.db` wird automatisch erstellt.

---

## Azure AD Authentifizierung konfigurieren

### Azure Portal einrichten

1. Im [Azure Portal](https://portal.azure.com) anmelden
2. Zu **Azure Active Directory** → **App registrations** navigieren
3. **New registration** klicken
4. Name eingeben: `TicketKPI Dashboard`
5. Supported account types wählen (z.B. "Accounts in this organizational directory only")
6. Redirect URI hinzufügen:
   - Platform: **Single-page application**
   - URI: `http://IHRE-DOMAIN/auth/callback` (für Produktion)
   - Für Entwicklung: `http://localhost:5173/auth/callback`
7. **Register** klicken

### Werte kopieren

Nach der Registrierung:
- **Application (client) ID** kopieren
- **Directory (tenant) ID** kopieren

### Umgebungsvariablen setzen

Datei `client/.env` erstellen:

```env
VITE_AZURE_CLIENT_ID=ihre-client-id
VITE_AZURE_TENANT_ID=ihre-tenant-id
VITE_AZURE_REDIRECT_URI=http://IHRE-DOMAIN/auth/callback
```

### Token-Claims konfigurieren (optional)

Falls E-Mail nicht im Token enthalten ist:
1. App Registration → **Token configuration**
2. **Add optional claim**
3. `email` und `preferred_username` hinzufügen

### Entwickler-Modus

Ohne Azure AD Konfiguration zeigt die Login-Seite automatisch den **Entwickler-Modus** an. Damit kann man sich mit einer beliebigen E-Mail-Adresse anmelden (nur für Testzwecke).

---

## SMTP E-Mail-Service konfigurieren

Für die Einladungs-Funktion wird ein SMTP-Server benötigt.

### Konfiguration

In `server/database.config.json` den `email`-Abschnitt hinzufügen:

```json
{
  "database": { ... },
  "server": { ... },
  "email": {
    "enabled": true,
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "user": "your-email@example.com",
    "password": "your-password",
    "from": "noreply@example.com"
  }
}
```

### Parameter

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `enabled` | E-Mail aktivieren | `true` |
| `host` | SMTP-Server | `smtp.gmail.com` |
| `port` | SMTP-Port | `587` (TLS) oder `465` (SSL) |
| `secure` | SSL verwenden | `true` für Port 465 |
| `user` | SMTP-Benutzer | `your-email@gmail.com` |
| `password` | SMTP-Passwort | `app-password` |
| `from` | Absender-Adresse | `noreply@example.com` |

### Gmail Beispiel

Für Gmail muss ein **App-Passwort** erstellt werden (nicht das normale Passwort):

1. Google-Konto → Sicherheit → 2-Faktor-Authentifizierung aktivieren
2. App-Passwörter → Neues App-Passwort erstellen
3. Passwort in der Konfiguration verwenden

```json
"email": {
  "enabled": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "password": "abcd-efgh-ijkl-mnop",
  "from": "your-email@gmail.com"
}
```

### Ohne E-Mail-Service

Wenn kein SMTP konfiguriert ist (`enabled: false`), wird beim Einladen ein Link angezeigt, den man manuell an die Person senden kann.

---

## Benutzer einladen

### Voraussetzungen

- Administrator-Rolle erforderlich
- SMTP konfiguriert ODER manueller Link-Versand

### Einladung senden

1. Als Administrator anmelden
2. Im Admin-Panel auf **"Einladen"** klicken
3. E-Mail-Adresse eingeben (erforderlich)
4. Name, Kürzel und Rolle optional ergänzen
5. **"Einladung senden"** klicken

### Einladungsprozess

1. Die eingeladene Person erhält eine E-Mail mit einem Link
2. Der Link führt zur Passwort-Setzen-Seite
3. Die Person wählt ein Passwort (Anforderungen: 8+ Zeichen, Groß/Klein, Zahl, Sonderzeichen)
4. Nach dem Setzen kann sich die Person anmelden

### Offene Einladungen

Im Tab **"Offene Einladungen"** können Sie:
- Noch nicht aktivierte Einladungen sehen
- Einladungen erneut senden
- Einladungen stornieren

### Einladungsgültigkeit

Einladungslinks sind **7 Tage** gültig.

---

## Anwendung starten

### Entwicklung

```bash
# Im Projektverzeichnis
npm run dev
```

Startet Server (Port 3001) und Client (Port 5173).

### Produktion

**Nur Server starten:**
```bash
npm run server
```

**Client für Produktion bauen:**
```bash
npm run build --workspace=client
```

Der gebaute Client liegt dann in `client/dist/` und kann von einem Webserver ausgeliefert werden.

---

## Produktionsbetrieb

### Option 1: PM2 (empfohlen)

PM2 ist ein Process Manager für Node.js-Anwendungen.

```bash
# PM2 global installieren
npm install -g pm2

# Anwendung starten
pm2 start npm --name "ticketkpi" -- run server

# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs ticketkpi

# Automatischer Start beim Boot
pm2 startup
pm2 save
```

### Option 2: systemd Service (Linux)

Service-Datei erstellen: `/etc/systemd/system/ticketkpi.service`

```ini
[Unit]
Description=KPI Dashboard
After=network.target

[Service]
Type=simple
User=ticketkpi
WorkingDirectory=/opt/ticketkpi
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=LD_LIBRARY_PATH=/opt/oracle/instantclient_19_9

[Install]
WantedBy=multi-user.target
```

Service aktivieren:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ticketkpi
sudo systemctl start ticketkpi
sudo systemctl status ticketkpi
```

### Option 3: Windows Service

Für Windows kann `node-windows` verwendet werden:

```bash
npm install -g node-windows
```

Service-Script `install-service.js` erstellen:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'TicketKPI',
  description: 'KPI Dashboard Server',
  script: 'C:\\Apps\\TicketKPI\\server\\index.js',
  env: [
    { name: 'NODE_ENV', value: 'production' }
  ]
});

svc.on('install', () => svc.start());
svc.install();
```

### Reverse Proxy (nginx)

Für Produktionsumgebungen wird ein Reverse Proxy empfohlen.

nginx-Konfiguration `/etc/nginx/sites-available/ticketkpi`:

```nginx
server {
    listen 80;
    server_name kpi.example.com;

    location / {
        root /opt/ticketkpi/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktivieren:
```bash
sudo ln -s /etc/nginx/sites-available/ticketkpi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Firewall-Konfiguration

### Linux (ufw)
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Windows
```powershell
netsh advfirewall firewall add rule name="KPI Dashboard" dir=in action=allow protocol=tcp localport=3001
```

---

## Fehlersuche

### Oracle-Verbindung fehlgeschlagen

1. Oracle Instant Client korrekt installiert?
   ```bash
   # Linux
   ldconfig -p | grep oci
   # Windows
   where oci.dll
   ```

2. Umgebungsvariable gesetzt?
   ```bash
   # Linux
   echo $LD_LIBRARY_PATH
   ```

3. Verbindung testen:
   ```bash
   cd server
   node -e "import('oracledb').then(o => console.log('Oracle DB Modul geladen:', !!o.default))"
   ```

### Server startet nicht

1. Prüfen ob Port belegt:
   ```bash
   # Linux
   netstat -tlnp | grep 3001
   # Windows
   netstat -an | findstr 3001
   ```

2. Logs prüfen:
   ```bash
   # Mit PM2
   pm2 logs ticketkpi
   ```

### Client zeigt keine Daten

1. Server läuft? `http://SERVER:3001/api/health`
2. Browser-Konsole prüfen (F12)
3. Netzwerk-Requests prüfen (F12 → Network)

---

## Backup

### SQLite-Konfiguration
```bash
# Linux (täglich mit cron)
0 2 * * * cp /opt/ticketkpi/config.db /backup/config-$(date +\%Y\%m\%d).db

# Windows (mit Task Scheduler)
copy C:\Apps\TicketKPI\config.db C:\Backup\config-%date%.db
```

---

## Update

```bash
# In Projektverzeichnis wechseln
cd /opt/ticketkpi

# Änderungen laden
git pull

# Abhängigkeiten aktualisieren
npm install

# Server neu starten
pm2 restart ticketkpi
# ODER
sudo systemctl restart ticketkpi
```

---

## Kontakt

Bei Problemen wenden Sie sich an den Administrator.
