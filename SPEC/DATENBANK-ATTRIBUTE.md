# Datenbank-Attribut-Dokumentation

## Übersicht

Dieses Dokument beschreibt alle verwendeten Attribute aus den Datenbanktabellen des Ticket KPI Dashboards.

---

## Verwendete Tabellen

| Tabelle | Beschreibung | Verwendung |
|---------|-------------|------------|
| `cs_tickets` | Haupttabelle mit Ticket-Daten | KPI-Berechnungen, Filter |
| `cs_ticket_protocol` | Protokoll-Tabelle für Status-Änderungen | Bearbeitungszeit-Berechnung |

---

## Tabelle: cs_tickets

### Attribute

| Attribut | Datentyp | Beschreibung | Verwendung |
|----------|----------|--------------|------------|
| `ticket_id` | TEXT/INTEGER | Eindeutige Ticket-ID | JOIN mit cs_ticket_protocol |
| `status` | TEXT | Ticket-Status | Status-Filterung (Neu, In Bearbeitung, Geschlossen) |
| `mapped_reporter` | TEXT | Name des Reporters (Ersteller) | Reporter-Filter, Reporter-KPIs |
| `mapped_agent` | TEXT | Name des Agenten (Bearbeiter) | Agent-Filter, Agent-KPIs |
| `type_name_de` | TEXT | Kategoriename (Deutsch) | Kategorie-Filter, Gruppierung |
| `priority_name_de` | TEXT | Prioritätsname (Deutsch) | Prioritäts-Filter, Gruppierung |
| `cdb_cdate` | TEXT/DATETIME | Erstellungsdatum | Jahresfilter, Bearbeitungszeit-Berechnung |

### Status-Codes

| Status-Code | Bedeutung | Dashboard-Anzeige |
|-------------|-----------|-------------------|
| `0` | Neu / Offen | "Neue Tickets", "Neu ohne Agent" |
| `80` | In Bearbeitung | "Aktuell in Bearbeitung", "In Bearbeitung" |
| `200` | Geschlossen | "Dieses Jahr geschlossen", "Geschlossen" |

### Verwendung pro Dashboard

#### Reporter Dashboard

| KPI | Verwendete Attribute | Berechnung |
|-----|---------------------|------------|
| Neue Tickets | `status = '0'`, `mapped_reporter` | COUNT WHERE status='0' |
| In Bearbeitung | `status = '80'`, `mapped_reporter` | COUNT WHERE status='80' |
| Gesamt | `mapped_reporter` | COUNT aller Tickets |
| Ø Bearbeitungszeit | `cdb_cdate`, `cdbprot_zeit` | AVG(Schließzeit - Erstellzeit) |
| Nach Kategorie | `type_name_de`, `status` | GROUP BY type_name_de |
| Nach Priorität | `priority_name_de`, `status` | GROUP BY priority_name_de |

#### Management Dashboard

| KPI | Verwendete Attribute | Berechnung |
|-----|---------------------|------------|
| Neu ohne Agent | `status = '0'`, `mapped_agent IS NULL` | COUNT ohne zugewiesenen Agent |
| In Bearbeitung | `status = '80'` | COUNT WHERE status='80' |
| Dieses Jahr geschlossen | `cdbprot_zeit`, `cdbprot_newstate = '200'` | COUNT mit Schließdatum dieses Jahr |
| Ø Bearbeitungszeit | `cdb_cdate`, `cdbprot_zeit` | AVG(Schließzeit - Erstellzeit) |

#### Agent Dashboard

| KPI | Verwendete Attribute | Berechnung |
|-----|---------------------|------------|
| In Bearbeitung | `status = '80'`, `mapped_agent` | COUNT WHERE status='80' |
| Dieses Jahr bearbeitet | `mapped_agent`, `cdbprot_zeit` | COUNT mit Schließdatum dieses Jahr |
| Ø Bearbeitungszeit | `cdb_cdate`, `cdbprot_zeit`, `mapped_agent` | AVG(Schließzeit - Erstellzeit) |
| Kollegen-Vergleich | `mapped_agent` (alle) | AVG über alle anderen Agenten |

---

## Tabelle: cs_ticket_protocol

### Attribute

| Attribut | Datentyp | Beschreibung | Verwendung |
|----------|----------|--------------|------------|
| `ticket_id` | TEXT/INTEGER | Fremdschlüssel zu cs_tickets | JOIN mit cs_tickets |
| `cdbprot_newstate` | TEXT | Neuer Status nach Änderung | Identifizierung von Schließung ('200') |
| `cdbprot_zeit` | TEXT/DATETIME | Zeitstempel der Status-Änderung | Bearbeitungszeit-Berechnung, Jahresfilter |

### Wichtige Status-Werte

| cdbprot_newstate | Bedeutung |
|------------------|-----------|
| `200` | Ticket wurde geschlossen |

---

## Filter-Abfragen

### Reporter-Liste (Dropdown)

```sql
SELECT DISTINCT mapped_reporter as id, mapped_reporter as name 
FROM cs_tickets 
WHERE mapped_reporter IS NOT NULL AND mapped_reporter != ''
ORDER BY mapped_reporter
```

### Agenten-Liste (Dropdown)

```sql
SELECT DISTINCT mapped_agent as id, mapped_agent as name 
FROM cs_tickets 
WHERE mapped_agent IS NOT NULL AND mapped_agent != ''
ORDER BY mapped_agent
```

### Kategorien-Liste (Dropdown)

```sql
SELECT DISTINCT type_name_de as id, type_name_de as name 
FROM cs_tickets 
WHERE type_name_de IS NOT NULL
ORDER BY type_name_de
```

### Prioritäten-Liste (Dropdown)

```sql
SELECT DISTINCT priority_name_de as id, priority_name_de as name 
FROM cs_tickets 
WHERE priority_name_de IS NOT NULL
ORDER BY 
  CASE priority_name_de
    WHEN 'Kritisch' THEN 1
    WHEN 'Hoch' THEN 2
    WHEN 'Mittel' THEN 3
    WHEN 'Niedrig' THEN 4
  END
```

---

## Bearbeitungszeit-Berechnung

### Formel

```
Bearbeitungszeit = cdbprot_zeit - cdb_cdate
```

### SQL-Implementierung

```sql
SELECT AVG(
  julianday(p.cdbprot_zeit) - julianday(t.cdb_cdate)
) * 24 * 60 as avg_minutes
FROM cs_tickets t
JOIN cs_ticket_protocol p ON t.ticket_id = p.ticket_id 
  AND p.cdbprot_newstate = '200'
WHERE strftime('%Y', t.cdb_cdate) = strftime('%Y', 'now')
  AND strftime('%Y', p.cdbprot_zeit) = strftime('%Y', 'now')
```

### Bedingungen

1. Ticket muss erstellt UND geschlossen im aktuellen Jahr sein
2. `cdbprot_newstate = '200'` identifiziert die Schließung
3. Ergebnis in Minuten (Tage × 24 × 60)

---

## Jahresfilter

Alle KPIs werden für das **aktuelle Jahr** berechnet:

```sql
strftime('%Y', cdb_cdate) = strftime('%Y', 'now')
```

Für "Dieses Jahr geschlossen":

```sql
strftime('%Y', cdbprot_zeit) = strftime('%Y', 'now')
```

---

## JOIN-Struktur

```
cs_tickets (t)
    |
    | JOIN ON ticket_id
    |
cs_ticket_protocol (p)
    |
    +-- WHERE p.cdbprot_newstate = '200' (nur Schließungen)
```

---

## Nicht verwendete Attribute

Die folgenden Attribute sind in der `cs_tickets` Tabelle vorhanden, werden aber **nicht** vom Dashboard verwendet:

- `cs_ticket_types` Tabelle (wird nicht benötigt, da `type_name_de` bereits in `cs_tickets` existiert)
- Weitere Status-Übergänge im Protokoll (nur Status '200' wird verwendet)

---

## Daten-Austausch

Beim Austauschen der `cedm_all_data.db` ist sicherzustellen, dass:

1. Alle oben genannten Attribute vorhanden sind
2. Die Status-Codes konsistent sind (0, 80, 200)
3. Die Namensformate für Reporter/Agent einheitlich sind
4. Die Datumsformate kompatibel sind (SQLite strftime)

---

## Beispiel-Datenstruktur

### cs_tickets

| ticket_id | status | mapped_reporter | mapped_agent | type_name_de | priority_name_de | cdb_cdate |
|-----------|--------|-----------------|--------------|--------------|------------------|-----------|
| T001 | 200 | Müller, Max | Schmidt, Anna | Störung | Hoch | 2024-01-15 10:00:00 |
| T002 | 80 | König, Thomas | Weber, Peter | Anfrage | Mittel | 2024-02-20 14:30:00 |
| T003 | 0 | Fischer, Lisa | NULL | Problem | Kritisch | 2024-03-01 09:15:00 |

### cs_ticket_protocol

| ticket_id | cdbprot_newstate | cdbprot_zeit |
|-----------|------------------|--------------|
| T001 | 200 | 2024-01-20 16:00:00 |
| T002 | 80 | 2024-02-21 10:00:00 |

---

## Legende

- **KPI**: Key Performance Indicator
- **AVG**: Durchschnitt (Average)
- **COUNT**: Anzahl
- **JOIN**: Tabellenverknüpfung
- **strftime**: SQLite Datumsfunktion
- **julianday**: SQLite Funktion für Tagesberechnung
