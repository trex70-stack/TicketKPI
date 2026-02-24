# Spezifikation Ticket KPI Dashboards

Es soll drei umschaltbare Dashboards geben:

- Dashboard 1: Allgemeine Sicht, es zeigt KPIs für einen Ticketsteller (Reporter)
- Dashboard 2: Management Sicht. es zeigt KPIs für das Management
- Dashboard 3: Agent Sicht. Es zeigt KPIs für den ausgewählten Ticket Bearbeiter (Agent)

#### Dashboard 1: Allgemeine Sicht, zeigt KPIs aus Sicht eines Ticketstellers (Reporter)

Hier sollen die folgenden KPI dargestellt werden:

- Wieviele meiner Tickets sind noch im Status neu (Statusnummer 0)
- Wieviele meiner Tickets sind gerade in Bearbeitung (Statusnummer 80)
- Wieviele Tickets habe ich insgesamt erfasst
- Wieviele meiner Tickets sind bereits erledigt und wie hoch war ihre Durchschnittliche Bearbeitungszeit

Diese KPIs gibt es jeweils für die Kombination Kategorie und Priorität

#### Dashboard 2: Management Sicht. es zeigt KPIs für das Management

Hier sollen die folgenden KPI dargestellt werden:

- Wieviele Tickets  sind noch im Status neu und haben keinen zugewiesenen Agent
- Wieviele Tickets sind gerade in Bearbeitung
- Wieviele Tickets wurden bereits dieses Jahr bearbeitet
- Wie lang war die durchschnittliche Bearbeitungszeit eines Tickets

Diese KPIs gibt es jeweils für die Kombination Kategorie und Priorität

####   
Dashboard 3: Agent Sicht. Es zeigt KPIs für den ausgewählten Ticket Bearbeiter (Agent)

Hier sollen die folgenden KPI dargestellt werden:

- Wieviele meiner Tickets  sind noch im Status erfasst und haben keinen zugewiesenen Agent
- Wieviele Tickets habe ich gerade in Bearbeitung
- Wieviele Tickets haben meine Kollegen durchschnittlich in Bearbeitung


- Wieviele Tickets habe ich dieses Jahr bereits bearbeitet
- Wieviele Tickets haben meine Kollegen bereits durchschnittlich bearbeitet
- Wie lang war meine durchschnittliche Bearbeitungszeit eines Tickets
- Wie lang war die durchschnittliche Bearbeitungszeit meiner Kollegen

Diese KPIs gibt es jeweils für die Kombination Kategorie und Priorität

#### Wo sind die Informationen in der Datenbank zu finden

#####   
Datenbank

Die Datenbank ist eine SQLite Datenbank mit dem Namen cedm_all_data.db

##### Datenbanktabellen

- cs_ticket_ticket: Hier stehen die eigentlich Kerninformation eines Tickets.
- cs_ticket_types: Hier steht im Klartext die Kategorie der Tickets
- cs_ticket_protocol: Hier ist das Statusprotokoll eines Tickets hinterlegt

##### Statusnetz

| Statusnummer | Statusbezeichnung |  |
|--------------|-------------------|--|
| 0            | Neu               |  |
| 80           | Bearbeitung       |  |
| 200          | Geschlossen       |  |

#####   
Attribute

| Wert                              | Tabelle                            | Attribut              |
|-----------------------------------|------------------------------------|-----------------------|
| Bearbeiters (Agent)               | cs_tickets                         | mapped_agent          |
| Ticketerstellers (Reporter)       | cs_tickets                         | mapped_reporter       |
| Kategorie des Tickets             | cs_tickets                         | type_name_de          |
| Priorität des Tickets             | cs_tickets                         | priority_name_de      |
| Zeitpunkt der Neuanlage           | cs_tickets                         | cdb_cdate             |
| Eindeutige ID des Tickets         | cs_tickets<br />cs_ticket_protocol | ticket_id             |
| Aktuelle Statusnummer des Tickets | cs_tickets                         | status                |
| Aktuelle Statusbezeichnung        | cs_tickets                         | joined_status_name_de |
|                                   |                                    |                       |

In der Tabelle cs_ticket_protocol ist hinterlegt, zu welchem Zeitpunkt ein Ticket den Status gewechselt hat. Im Attribut cdbprot_oldstate steht der Ausgangsstatus. Im Attribut cdbprot_newstate steht der Status in den gewechselt wurde. Im Feld cdbprot_zeit steht der Zeitpunkt wann der Statuswechsel stattgefunden hat.