/**
 * KI-Datenampel – Regelbasierte Klassifikationslogik
 * 
 * Prinzip: Im Zweifel wird konservativer (höhere Farbe) eingestuft.
 * Grenzfälle erhalten bewusst ORANGE statt GRÜN bzw. ROT statt ORANGE.
 * Das ist kein Fehler, sondern Governance-Konsistenz.
 */

// ─── Keyword-Listen ───────────────────────────────────────────────────────────

const ROT_KEYWORDS = [
  // Personenbezug
  "personenbezogen","kundendaten","mitarbeiterdaten","patientendaten","bewerberdaten",
  "personalakte","krankenakte","gesundheitsdaten","biometrisch","gesichtserkennung",
  // Verträge / Finanzen
  "vertrag","verträge","preisliste","angebot","bankdaten","kontonummer","iban",
  "kreditkarte","zahlungsdaten","bilanz","jahresabschluss",
  // IP / Technik
  "cad","zeichnung","rezeptur","patent","quellcode","source code","api-key",
  "passwort","zugangsdaten","credential","geheimnis","betriebsgeheimnis",
  // Entscheidungen über Menschen
  "bewerbung","ranking","scoring","performance","kündigung","disziplinar",
  "eligibility","kreditentscheidung","versicherungsentscheidung","bonität",
  // Überwachung
  "überwachung","monitoring","tracking","kamera","bewegungsprofil","emotion",
  // Safety-kritisch
  "produktionsfreigabe","qualitätsfreigabe","medizinisch","diagnose","behandlung",
  "medikament","pharma","arzneimittel","safety","funktionale sicherheit",
];

const ORANGE_KEYWORDS = [
  "intern","protokoll","besprechungsprotokoll","meeting","status","report","bericht",
  "sop","arbeitsanweisung","prozessbeschreibung","capa","deviation","reklamation",
  "rfq","ausschreibung","lieferant","einkauf","bestellung",
  "budget","forecast","planung","kennzahl","kpi",
  "vorlage","template","policy","richtlinie","regelwerk",
  "support","ticket","kundenanfrage","beschwerde",
  "technisch","engineering","produktion","fertigung","störung",
];

const GRUEN_KEYWORDS = [
  "e-mail","email","entwurf","text","brainstorming","ideen","kreativ",
  "rechtschreibung","grammatik","korrektur","übersetzen","übersetzung",
  "zusammenfassung","öffentlich","artikel","norm","standard","faq",
  "präsentation","gliederung","struktur","agenda","einladung",
  "lean","prozessverbesserung","vorschlag","konzept",
];

// ─── Maßnahmen-Bibliothek ─────────────────────────────────────────────────────

const MASSNAHMEN = {
  GRÜN: [
    "Human Review vor externer Verwendung durchführen",
    "Keine vertraulichen Daten in das KI-Tool eingeben",
    "Output auf sachliche Korrektheit prüfen (KI halluziniert)",
    "Nur freigegebene Tools verwenden",
  ],
  ORANGE: [
    "Ausschließlich freigegebene, unternehmenseigene KI-Tools nutzen",
    "Eingabedaten vor der Verarbeitung anonymisieren / minimieren",
    "Human Review durch fachlich verantwortliche Person (Owner) sicherstellen",
    "Use Case im internen KI-Register dokumentieren",
    "Ergebnis vor Weiterverwendung auf Richtigkeit prüfen",
  ],
  ROT: [
    "Kein Einsatz ohne formale Governance-Prüfung und Freigabe",
    "Governance-Owner und Datenschutzbeauftragten einbeziehen",
    "Risikoanalyse nach EU AI Act / DSGVO durchführen",
    "Incident-Plan und Eskalationspfad definieren",
    "Nur nach dokumentiertem Freigabeprozess operativ einsetzen",
  ],
};

// ─── Literacy-Fragen-Bibliothek ───────────────────────────────────────────────

const LITERACY_FRAGEN = {
  GRÜN: [
    {
      frage: "Ist dir bekannt, dass keine personenbezogenen Daten oder vertraulichen Inhalte in dieses Tool eingegeben werden dürfen?",
      hint: "Schulung zu Datenschutz-Grundlagen und KI-Nutzungsrichtlinie empfohlen",
    },
    {
      frage: "Weißt du, dass KI-Outputs immer mit Human Review geprüft werden müssen, bevor sie extern verwendet werden?",
      hint: "Awareness-Training zu KI-Grenzen (Halluzinationen, Fehler) empfohlen",
    },
    {
      frage: "Nutzt du ausschließlich die vom Unternehmen freigegebenen KI-Tools?",
      hint: "Whitelist freigegebener Tools kommunizieren; Shadow-AI-Risiken erklären",
    },
  ],
  ORANGE: [
    {
      frage: "Kennst du die Regeln zur Datenminimierung und Anonymisierung für diesen Use Case?",
      hint: "Schulung zu Datenminimierung und DSGVO-konformer KI-Nutzung empfohlen",
    },
    {
      frage: "Weißt du, welches freigegebene KI-Tool für diesen Anwendungsfall zugelassen ist?",
      hint: "Tool-Whitelist und Freigabeprozess kommunizieren",
    },
    {
      frage: "Bist du dir deiner Verantwortung als Owner / Reviewer für den KI-Output bewusst?",
      hint: "Rollenverantwortung und Human-Oversight-Pflicht erklären",
    },
    {
      frage: "Ist dir bekannt, dass dieser Use Case im internen KI-Register dokumentiert werden muss?",
      hint: "Governance-Prozess und Register-Pflicht kommunizieren",
    },
  ],
  ROT: [
    {
      frage: "Ist dir klar, dass dieser Use Case nur nach einer formalen Governance-Prüfung und Freigabe eingesetzt werden darf?",
      hint: "Governance-Prozess, Freigabepfad und zuständige Rolle benennen",
    },
    {
      frage: "Kennst du den Eskalationspfad und Ansprechpartner für diesen risikobehafteten Einsatz?",
      hint: "Incident-Response-Plan und Governance-Owner benennen",
    },
    {
      frage: "Bist du dir der regulatorischen Anforderungen (EU AI Act, DSGVO, ggf. Sektorrecht) für diesen Use Case bewusst?",
      hint: "Vertiefende Schulung zu EU AI Act Hochrisiko-Anforderungen empfohlen",
    },
  ],
};

// ─── Begründungs-Templates ────────────────────────────────────────────────────

const BEGRUENDUNG = {
  GRÜN: (name, ctx) =>
    `„${name}" wurde als GRÜN eingestuft, da keine Hinweise auf personenbezogene Daten, Verträge, IP oder sicherheitskritische Entscheidungen vorliegen. ` +
    `Im Kontext ${ctx.industry || "des Unternehmens"} handelt es sich um einen typischen Schreibassistenz-Use-Case mit überschaubarem Risiko. ` +
    `Human Review vor externer Verwendung ist dennoch Pflicht.`,

  ORANGE: (name, ctx) =>
    `„${name}" wurde als ORANGE eingestuft, da interne Inhalte verarbeitet werden, die ein erhöhtes Vertraulichkeits- oder Compliance-Risiko tragen. ` +
    `Für ${ctx.industry || "diesen Sektor"} gilt: Einsatz nur mit freigegebenem Tool, Anonymisierung der Eingaben, Human Review und Dokumentation im KI-Register. ` +
    `Grenzfälle wurden dabei bewusst konservativ als ORANGE statt GRÜN bewertet.`,

  ROT: (name, ctx) =>
    `„${name}" wurde als ROT eingestuft. Es liegen Merkmale vor, die auf personenbezogene Daten, vertrauliche Unternehmensinformationen, Entscheidungen über Menschen oder safety-kritische Prozesse hinweisen. ` +
    `Im regulatorischen Umfeld „${ctx.regulatory || "DSGVO"}" ist ein formaler Governance-Prozess vor dem Einsatz zwingend erforderlich. ` +
    `Grenzfälle wurden konservativ als ROT statt ORANGE bewertet.`,
};

// ─── Klassifikations-Engine ───────────────────────────────────────────────────

function scoreText(text) {
  const t = (text || "").toLowerCase();
  let rotScore = 0;
  let orangeScore = 0;
  let gruenScore = 0;

  ROT_KEYWORDS.forEach(kw => { if (t.includes(kw)) rotScore += 2; });
  ORANGE_KEYWORDS.forEach(kw => { if (t.includes(kw)) orangeScore += 1; });
  GRUEN_KEYWORDS.forEach(kw => { if (t.includes(kw)) gruenScore += 1; });

  return { rotScore, orangeScore, gruenScore };
}

/**
 * Klassifiziert einen Use Case regelbasiert.
 * @param {object} uc - { name, description, department, wizardAmpel }
 * @param {object} context - Unternehmenskontext
 * @returns {object} - { ampel, begruendung, massnahmen, literacyFragen, redFlag, grenzfall }
 */
export function klassifiziere(uc, context) {
  const fullText = `${uc.name} ${uc.description || ""} ${uc.department || ""}`;
  const { rotScore, orangeScore, gruenScore } = scoreText(fullText);

  // Regulatorischer Kontext verschärft Bewertung
  const isKritisch = ["KRITIS / NIS2","Finanzregulierung","Medizinrecht / MDR / IVDR","EU AI Act Hochrisiko-Umfeld"]
    .some(r => context.regulatory?.includes(r.split(" ")[0]));

  const isEinstieg = context.ai_maturity?.includes("Einstieg") || context.ai_maturity?.includes("Pilotphase");

  // Wizard-Signal als starkes Prior
  let ampel;
  let grenzfall = false;

  if (uc.wizardAmpel === "ROT" || rotScore >= 2) {
    ampel = "ROT";
  } else if (uc.wizardAmpel === "ORANGE" || orangeScore >= 2) {
    // Verschärfung bei kritischem Umfeld
    ampel = (isKritisch && orangeScore >= 3) ? "ROT" : "ORANGE";
    if (isKritisch && orangeScore >= 3) grenzfall = true;
  } else if (uc.wizardAmpel === "GRÜN" && gruenScore >= 1 && rotScore === 0 && orangeScore === 0) {
    ampel = "GRÜN";
  } else {
    // Grenzfall: konservativ einstufen
    grenzfall = true;
    if (rotScore >= 1) { ampel = "ROT"; }
    else if (orangeScore >= 1 || isEinstieg) { ampel = "ORANGE"; }
    else { ampel = "ORANGE"; } // Im Zweifel ORANGE, nie unkontrolliert GRÜN
  }

  // Kein freigegebenes Governance → ORANGE nicht unter ORANGE
  if (context.governance?.includes("Nichts vorhanden") && ampel === "GRÜN" && !uc.wizardAmpel) {
    ampel = "ORANGE";
    grenzfall = true;
  }

  const redFlag = ampel === "ROT" ||
    (ampel === "ORANGE" && isKritisch) ||
    fullText.toLowerCase().includes("shadow") ||
    fullText.toLowerCase().includes("überwach");

  return {
    ampel,
    begruendung: BEGRUENDUNG[ampel](uc.name, context),
    massnahmen: MASSNAHMEN[ampel],
    literacyFragen: LITERACY_FRAGEN[ampel],
    redFlag,
    grenzfall,
  };
}
