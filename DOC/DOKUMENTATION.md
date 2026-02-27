# Ticket KPI Dashboard - Anwenderdokumentation

## Inhaltsverzeichnis

1. [Anwender-Dokumentation](#anwender-dokumentation)
   - [Anmeldung](#anmeldung)
   - [Dashboard-Übersicht](#dashboard-übersicht)
   - [Reporter Dashboard](#reporter-dashboard)
   - [Agent Dashboard](#agent-dashboard)
   - [Filter verwenden](#filter-verwenden)
   - [Dark Mode](#dark-mode)

2. [Administrator-Dokumentation](#administrator-dokumentation)
   - [Benutzerverwaltung](#benutzerverwaltung)
   - [Rollen vergeben](#rollen-vergeben)
   - [Neue Benutzer anlegen](#neue-benutzer-anlegen)
   - [Benutzer löschen](#benutzer-löschen)

---

# Anwender-Dokumentation

## Anmeldung

### Anmeldung mit Microsoft-Konto

1. Öffnen Sie das Ticket KPI Dashboard im Browser
2. Klicken Sie auf **"Mit Microsoft anmelden"**
3. Geben Sie Ihre Microsoft-Anmeldedaten ein
4. Nach erfolgreicher Anmeldung werden Sie automatisch zum Dashboard weitergeleitet

### Anmeldung im Entwickler-Modus (nur für Tests)

1. Klicken Sie auf **"Entwickler-Modus"**
2. Geben Sie Ihre E-Mail-Adresse ein
3. Klicken Sie auf **"Anmelden"**

> **Hinweis:** Der Name wird automatisch aus der Datenbank geladen, wenn Sie bereits registriert sind.

---

## Dashboard-Übersicht

Nach der Anmeldung sehen Sie basierend auf Ihrer Rolle verschiedene Dashboards:

| Rolle | Sichtbare Dashboards |
|-------|---------------------|
| **Administrator** | Reporter, Management, Agent |
| **Management** | Management + Reporter/Agent (wenn in Liste enthalten) |
| **Standard User** | Reporter und/oder Agent (wenn in Liste enthalten) |

### Navigation

- **Desktop:** Verwenden Sie die Sidebar auf der linken Seite
- **Mobile:** Verwenden Sie die Tabs oben im Header

---

## Reporter Dashboard

Das Reporter Dashboard zeigt Ihre Tickets als Reporter (Ersteller).

### Gesamtübersicht (oben)

Unabhängig vom gewählten Reporter sehen Sie oben zwei große KPI-Karten:

| Kennzahl | Beschreibung |
|----------|-------------|
| **Aktuell in Bearbeitung** | Anzahl aller Tickets, die aktuell bearbeitet werden |
| **Dieses Jahr geschlossen** | Anzahl aller Tickets, die dieses Jahr geschlossen wurden |

### Meine Tickets

Darunter finden Sie reporter-spezifische Kennzahlen:

| Kennzahl | Beschreibung |
|----------|-------------|
| **Neue Tickets** | Neue, noch nicht bearbeitete Tickets |
| **Aktuell in Bearbeitung** | Ihre Tickets, die aktuell bearbeitet werden |
| **Gesamt** | Gesamte Anzahl Ihrer Tickets |
| **Ø Bearbeitungszeit** | Durchschnittliche Bearbeitungszeit Ihrer Tickets |

### Diagramme

- **Tickets nach Kategorie:** Balkendiagramm der Ticketverteilung
- **Verteilung nach Kategorie:** Tortendiagramm der Kategorien

---

## Agent Dashboard

Das Agent Dashboard zeigt Ihre Tickets als Bearbeiter (Agent).

### Kennzahlen

| Kennzahl | Beschreibung |
|----------|-------------|
| **Neu ohne Agent** | Neue Tickets ohne zugewiesenen Agent |
| **Aktuell in Bearbeitung** | Ihre aktuell bearbeiteten Tickets |
| **Dieses Jahr bearbeitet** | Tickets, die Sie dieses Jahr abgeschlossen haben |
| **Ø Bearbeitungszeit** | Ihre durchschnittliche Bearbeitungszeit |

### Vergleiche

Das Dashboard zeigt Vergleiche mit Ihren Kollegen:
- **Vergleich: Ich vs. Kollegen Ø** - Gegenüberstellung Ihrer Kennzahlen mit dem Durchschnitt
- **Ø Bearbeitungszeit: Ich vs. Kollegen** - Zeitvergleich

---

## Filter verwenden

In allen Dashboards können Sie die Daten filtern:

### Filteroptionen

| Filter | Beschreibung |
|--------|-------------|
| **Kategorie** | Filtern nach Ticket-Kategorie |
| **Priorität** | Filtern nach Prioritätsstufe |
| **Reporter/Agent** | Auswahl der Person (nur für Admins änderbar) |

### Filter anwenden

1. Wählen Sie die gewünschte Kategorie aus dem Dropdown
2. Wählen Sie die gewünschte Priorität aus dem Dropdown
3. Die Daten werden automatisch aktualisiert

> **Hinweis:** Wählen Sie "Alle" um den Filter zurückzusetzen.

---

## Dark Mode

### Dark Mode aktivieren

1. Klicken Sie in der Sidebar (Desktop) oder im Header (Mobile) auf **"Dark Mode"**
2. Die Ansicht wechselt in den dunklen Modus

### Light Mode aktivieren

1. Klicken Sie auf **"Light Mode"**
2. Die Ansicht wechselt zurück in den hellen Modus

> **Hinweis:** Ihre Einstellung wird gespeichert und beim nächsten Login wiederhergestellt.

---

## Abmeldung

1. Klicken Sie in der Sidebar oder im Header auf **"Logout"**
2. Sie werden zur Anmeldeseite weitergeleitet

---

# Administrator-Dokumentation

## Voraussetzungen

- Sie müssen mit einem Administratorkonto angemeldet sein
- Der "Admin Panel" Button ist in der Sidebar sichtbar

---

## Benutzerverwaltung

### Admin Panel öffnen

1. Klicken Sie in der Sidebar auf **"Admin Panel"**
2. Die Benutzerverwaltung wird geöffnet

---

## Rollen vergeben

### Verfügbare Rollen

| Rolle | Berechtigungen |
|-------|---------------|
| **Administrator** | Kann Rollen vergeben, alle Dashboards sehen, Benutzer verwalten |
| **Management** | Kann Management-Dashboard sehen + eigene Reporter/Agent-Dashboards |
| **Standard User** | Nur eigene Dashboards (Reporter/Agent) wenn in Liste enthalten |

### Rolle ändern

1. Suchen Sie den Benutzer in der Tabelle
2. Klicken Sie auf das Rollen-Dropdown
3. Wählen Sie die neue Rolle aus
4. Die Änderung wird sofort gespeichert

> **Hinweis:** Sie können Ihre eigene Rolle nicht ändern.

---

## Neue Benutzer anlegen

1. Klicken Sie oben rechts auf **"Neuer Benutzer"**
2. Füllen Sie das Formular aus:
   - **Name:** Vollständiger Name (z.B. "Müller, Max")
   - **E-Mail:** E-Mail-Adresse (z.B. "mm@contact.de")
   - **Rolle:** Wählen Sie Standard User, Management oder Administrator
3. Klicken Sie auf **"Anlegen"**

> **Hinweis:** Benutzer werden beim ersten Login automatisch erstellt, wenn sie sich über Microsoft SSO anmelden. Das manuelle Anlegen ist für Vorbereitungszwecke.

---

## Benutzer löschen

1. Suchen Sie den Benutzer in der Tabelle
2. Klicken Sie auf das **Papierkorb-Icon** rechts
3. Bestätigen Sie die Löschung im Dialog

### Einschränkungen

- Sie können sich nicht selbst löschen
- Der Standard-Admin (tk@contact.de) kann nicht gelöscht werden

---

## Dashboard-Sichtbarkeit verstehen

Die Sichtbarkeit der Dashboards hängt von zwei Faktoren ab:

### 1. Rolle des Benutzers

| Rolle | Management Dashboard |
|-------|---------------------|
| Admin | ✓ Sichtbar |
| Management | ✓ Sichtbar |
| Standard | ✗ Nicht sichtbar |

### 2. Name in der Reporter/Agent-Liste

Damit ein Benutzer das Reporter- oder Agent-Dashboard sieht, muss sein Name exakt in der entsprechenden Liste enthalten sein:

- **Name in Reporter-Liste** → Reporter Dashboard sichtbar
- **Name in Agent-Liste** → Agent Dashboard sichtbar
- **Name in keiner Liste** → Dashboard wird ausgeblendet

> **Wichtig:** Die Namen in der Benutzerdatenbank und den Reporter/Agent-Listen müssen übereinstimmen!

---

## Fehlerbehebung

### Benutzer sieht kein Dashboard

**Ursachen:**
1. Benutzer hat Rolle "Standard" aber Name nicht in Reporter/Agent-Liste
2. Name ist falsch geschrieben oder Format stimmt nicht

**Lösung:**
1. Prüfen Sie die Schreibweise des Namens in der Benutzerliste
2. Vergleichen Sie mit der Reporter/Agent-Liste im System
3. Korrigieren Sie ggf. den Namen oder weisen Sie eine höhere Rolle zu

### Benutzer kann Management-Dashboard nicht sehen

**Ursache:** Benutzer hat Rolle "Standard"

**Lösung:** Ändern Sie die Rolle auf "Management" oder "Administrator"

---

## Sicherheitshinweise

- Administratoren haben vollen Zugriff auf alle Funktionen
- Rollen sollten nur bei Bedarf erhöht werden
- Inaktive Benutzer sollten gelöscht werden
- Der Standard-Admin ist permanent geschützt

---

## Support

Bei Problemen wenden Sie sich an Ihren Administrator oder an:
- E-Mail: tk@contact.de
