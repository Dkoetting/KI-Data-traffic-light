# KI-Datenampel

Regelbasiertes AI Governance Tool zur Use Case Bewertung nach EU AI Act Art. 4.

**Kein API-Key erforderlich. Läuft vollständig im Browser.**

## Stack
React 18 + Vite · Papaparse (CSV) · Kein Backend · Kein API-Key

## Deploy (GitHub → Vercel)
```bash
npm install && npm run build
```
Vercel erkennt Vite automatisch. Framework: Vite. Output: dist/.

## Features
- Unternehmenskontext-Fragebogen (5 Fragen, kontextsensitive Bewertung)
- Use Case Erfassung: Manuell, 5-Fragen-Wizard, CSV-Import
- Regelbasierte Ampelbewertung (GRÜN/ORANGE/ROT)
- Grenzfall-Markierung mit Vorsichtsprinzip-Hinweis
- Art. 4 AI Literacy Check pro Use Case (Ja/Nein + Trainingshint)
- Literacy-Badges: OK / Training offen / Formaler Prozess
- Filter nach Ampelfarbe
- Export: Use Case CSV + Literacy-Nachweis CSV (Art. 4)
- E-Mail-Gate vor Report

## Bewertungslogik
Grenzfälle werden bewusst in die strengere Kategorie eingestuft (Vorsichtsprinzip).
Keyword-Matching + 5-Fragen-Wizard + Unternehmenskontext → Ampel.
Regulatorisch kritische Sektoren (KRITIS, MedTech, Finanz) → verschärfte Bewertung.

## Kein Rechtsrat
Für interne Governance & Nachweisbarkeit (Art. 4 AI Literacy + Basis).
