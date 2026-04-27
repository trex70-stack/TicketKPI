# Ticket Export Modul

## Übersicht

Dieses Modul bietet Funktionen zum Exportieren von geschlossenen Tickets in Excel-Dateien.

## Verwendung

### 1. Standalone Script (Empfohlen)

```bash
# Standard: Jahr 2026
node server/export/run-export.js

# Eigenes Jahr (z.B. 2025)
node server/export/run-export.js 25

# Eigenes Jahr und Ausgabedatei
node server/export/run-export.js 26 meine_tickets.xlsx
```

Die Excel-Datei wird im Projekt-Root erstellt.

**Hinweis:** Das Script nutzt den Default-Key für die config.db. Falls du einen eigenen Key verwendest, setze die Umgebungsvariable:
```bash
set CONFIG_DB_KEY=dein-eigener-key
node server/export/run-export.js 26
```

### 2. API-Endpoint (bei laufendem Server)

```
GET /api/export/closed-tickets/:year?
```

**Parameter:**
- `year` (optional): Jahr im Format `YY` oder `YYYY` (Standard: `26` für 2026)

**Query-Parameter:**
- `format`: `excel` (Standard) oder `json`

**Beispiele:**

```bash
# Excel-Download für 2026
curl -O http://localhost:3001/api/export/closed-tickets/26

# Excel-Download für 2025
curl -O http://localhost:3001/api/export/closed-tickets/25

# JSON-Response
curl http://localhost:3001/api/export/closed-tickets/26?format=json
```

### 3. Programmatische Verwendung

```javascript
import { getClosedTicketsData, generateExcelReport, getExcelBuffer } from './export/closed-tickets-report.js';

// Rohdaten abrufen
const data = await getClosedTicketsData('26');

// Excel-Datei generieren und speichern
await generateExcelReport('26', './output.xlsx');

// Excel als Buffer (für API-Response)
const buffer = await getExcelBuffer('26');
```

## Excel-Datei Struktur

Die Excel-Datei enthält zwei Arbeitsblätter:

### Arbeitsblatt 1: "Geschlossene Tickets"

Listet alle geschlossenen Tickets mit folgenden Spalten auf:

| Spalte | Beschreibung |
|--------|--------------|
| Ticketnummer | Eindeutige Ticket-ID |
| Titel | Titel des Tickets (title_de) |
| Bearbeiter | Name des Bearbeiters |
| Kategorie | Ticket-Kategorie (type_name_de) |
| Priorität | Ticket-Priorität (priority_name_de) |
| Beginn Bearbeitung | Zeitstempel Status "In Bearbeitung" (80) |
| Abgeschlossen am | Zeitstempel Status "Geschlossen" (200) |
| Zeit Status Neu (Stunden) | Erstellung → Status 80 (Kalender-Stunden) |
| Zeit Status Neu (Tage) | Erstellung → Status 80 (Kalender-Tage) |
| Zeit Status Neu (Arbeitsstunden) | Erstellung → Status 80 (8h/Tag) |
| Dauer Bearbeitung (Stunden) | Status 80 → Status 200 (Kalender-Stunden) |
| Dauer Bearbeitung (Tage) | Status 80 → Status 200 (Kalender-Tage) |
| Arbeitsstunden Bearbeitung | Status 80 → Status 200 (8h/Tag) |
| Gesamtdurchlaufzeit (Stunden) | Erstellung → Status 200 (Kalender-Stunden) |
| Gesamtdurchlaufzeit (Tage) | Erstellung → Status 200 (Kalender-Tage) |
| Gesamtdurchlaufzeit (Arbeitsstunden) | Erstellung → Status 200 (8h/Tag) |

### Arbeitsblatt 2: "Zusammenfassung"

Enthält statistische Auswertungen:

#### Gesamt-Statistik
- Anzahl Werkstage (Mo-Fr abzüglich Feiertage)
- Anzahl neue Tickets
- Durchschnitt neue Tickets pro Werktag

#### Nach Kategorie
Durchschnittliche neue Tickets pro Werktag je Kategorie.

#### Nach Monat
Anzahl Werkstage, Tickets und Durchschnitt pro Monat.

## Berechnung Arbeitsstunden

Die Arbeitsstunden werden basierend auf der tatsächlichen Arbeitszeit berechnet:

### Arbeitszeit-Definition

| Zeitraum | Stunden |
|----------|---------|
| 08:00 - 12:00 | 4h (Vormittags) |
| 12:00 - 13:00 | Mittagspause (0h) |
| 13:00 - 17:00 | 4h (Nachmittags) |
| **Gesamt** | **8h/Tag** |

### Berechnungsregeln

1. **Erster Tag:** Stunden von Startzeit bis 17:00 (inkl. Mittagspause)
2. **Zwischentage:** Jeder Werktag = 8h
3. **Letzter Tag:** Stunden von 08:00 bis Endzeit (inkl. Mittagspause)
4. **Gleicher Tag:** Stunden zwischen Start und Ende (inkl. Mittagspause)

### Zeit-Begrenzungen

- Start vor 08:00 → wird auf 08:00 gesetzt
- Start nach 17:00 → zählt zum nächsten Werktag
- Ende vor 08:00 → zählt zum vorherigen Werktag
- Ende nach 17:00 → wird auf 17:00 gesetzt
- Start/Ende am Wochenende/Feiertag → wird auf nächsten/vorherigen Werktag gesetzt

### Beispiele

| Start | Ende | Berechnung | Arbeitsstunden |
|-------|------|------------|----------------|
| 10:00 | 14:00 | 10-12 (2h) + 13-14 (1h) | 3h |
| 11:00 | 16:00 | 11-12 (1h) + 13-16 (3h) | 4h |
| 08:00 | 17:00 | 8-12 (4h) + 13-17 (4h) | 8h |
| 09:00 | 11:00 | 9-11 (2h) | 2h |
| 06:00 | 10:00 | 8-10 (Start begrenzt) | 2h |
| 14:00 | 19:00 | 14-17 (Ende begrenzt) | 3h |

### Mehrtage-Beispiel

**Start:** Di 14.04.2026 10:30  
**Ende:** Fr 17.04.2026 15:00

| Tag | Berechnung | Stunden |
|-----|------------|---------|
| Di 14.04. | 10:30-12:00 (1,5h) + 13:00-17:00 (4h) | 5,5h |
| Mi 15.04. | 08:00-12:00 + 13:00-17:00 | 8h |
| Do 16.04. | 08:00-12:00 + 13:00-17:00 | 8h |
| Fr 17.04. | 08:00-12:00 (4h) + 13:00-15:00 (2h) | 6h |
| **Gesamt** | | **27,5h** |

### Bundesweite Feiertage

- Neujahr (01.01.)
- Karfreitag (beweglich)
- Ostermontag (beweglich)
- Tag der Arbeit (01.05.)
- Christi Himmelfahrt (beweglich)
- Pfingstmontag (beweglich)
- Tag der Deutschen Einheit (03.10.)
- 1. Weihnachtstag (25.12.)
- 2. Weihnachtstag (26.12.)

## Status-Codes

| Code | Bedeutung |
|------|-----------|
| 0 | Neu |
| 80 | In Bearbeitung |
| 200 | Geschlossen |

## Hinweise

### Arbeitsblatt "Geschlossene Tickets"
- Drei Zeitspannen werden berechnet:
  1. **Zeit Status Neu:** Von Erstellung bis Status 80 (In Bearbeitung)
  2. **Dauer Bearbeitung:** Von Status 80 bis Status 200 (Geschlossen)
  3. **Gesamtdurchlaufzeit:** Von Erstellung bis Status 200 (Geschlossen)
- Jede Zeitspanne wird in Stunden, Tagen und Arbeitsstunden angezeigt
- Tickets ohne Status 80 haben keine Werte für "Zeit Status Neu" und "Dauer Bearbeitung"
- Arbeitsstunden berücksichtigen Wochenenden und bundesweite Feiertage

### Arbeitsblatt "Zusammenfassung"
- **Durchschnitt neue Tickets pro Werktag:** Berechnet basierend auf allen erstellten Tickets im Jahr
- **Werktage:** Montag bis Freitag, abzüglich bundesweiter Feiertage
- **Zeitraum:** Vom 01.01. des Jahres bis heute (oder Jahresende)
- Nach Kategorie und Monat gruppiert
