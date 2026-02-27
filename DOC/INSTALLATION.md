# KPI Dashboard - Installationsanleitung

## Inhaltsverzeichnis
1. [Voraussetzungen](#voraussetzungen)
2. [Installation unter Windows](#installation-unter-windows)
3. [Installation unter Linux](#installation-unter-linux)
4. [Oracle Instant Client installieren](#oracle-instant-client-installieren)
5. [Anwendung konfigurieren](#anwendung-konfigurieren)
6. [Anwendung starten](#anwendung-starten)
7. [Zugriff von anderen Rechnern](#zugriff-von-anderen-rechnern)
8. [Produktionsbetrieb](#produktionsbetrieb)

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

## Zugriff von anderen Rechnern

Damit das Dashboard von anderen Rechnern im Netzwerk erreichbar ist, sind folgende Schritte notwendig:

### 1. Firewall konfigurieren

**Windows:**
```powershell
# Port 3001 für API öffnen
netsh advfirewall firewall add rule name="KPI Dashboard API" dir=in action=allow protocol=tcp localport=3001

# Port 5173 für Entwicklungsserver öffnen (optional)
netsh advfirewall firewall add rule name="KPI Dashboard Client" dir=in action=allow protocol=tcp localport=5173
```

**Linux (ufw):**
```bash
# Port 3001 für API öffnen
sudo ufw allow 3001/tcp

# Port 5173 für Entwicklungsserver öffnen (optional)
sudo ufw allow 5173/tcp
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

### 2. Client-Konfiguration

Der Client ist bereits so konfiguriert, dass er automatisch die IP-Adresse des Servers verwendet. Die API-URL wird dynamisch ermittelt:

```javascript
// In api.js und AuthContext.jsx
const host = window.location.hostname;
const API_BASE = `http://${host}:3001/api`;
```

### 3. Zugriff testen

Nach dem Start der Anwendung kann das Dashboard von anderen Rechnern aufgerufen werden:

```
http://<SERVER-IP>:5173
```

Beispiel: `http://192.168.1.100:5173`

### 4. Produktionsbetrieb mit Reverse Proxy

Für den produktiven Einsatz wird ein Reverse Proxy (nginx, Apache) empfohlen. Siehe dazu den Abschnitt [Produktionsbetrieb](#produktionsbetrieb).

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

### Reverse Proxy (Apache)

Apache-Konfiguration `/etc/apache2/sites-available/ticketkpi.conf`:

```apache
<VirtualHost *:80>
    ServerName kpi.example.com
    DocumentRoot /opt/ticketkpi/client/dist

    <Directory /opt/ticketkpi/client/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
</VirtualHost>
```

Aktivieren:
```bash
sudo a2enmod proxy proxy_http rewrite
sudo a2ensite ticketkpi
sudo systemctl reload apache2
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

### Zugriff von anderen Rechnern nicht möglich

1. **Firewall:** Port 3001 und 5173 offen?
   ```bash
   # Linux - Status prüfen
   sudo ufw status
   
   # Windows - Regeln auflisten
   netsh advfirewall firewall show rule name="KPI Dashboard API"
   ```

2. **Server-Bindung:** Server muss an `0.0.0.0` binden (bereits konfiguriert)

3. **Client-URL:** Wird automatisch ermittelt - sollte funktionieren

4. **Netzwerk:** Server und Client im selben Netzwerk?
   ```bash
   # Server-IP ermitteln
   # Linux
   ip addr show
   # Windows
   ipconfig
   ```

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
