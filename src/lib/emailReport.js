import emailjs from '@emailjs/browser';

/**
 * Baut den Report-Text aus den Ergebnissen zusammen
 */
function buildReportText(results, context) {
  const counts = {
    GRÜN: results.filter(r => r.ampel === 'GRÜN').length,
    ORANGE: results.filter(r => r.ampel === 'ORANGE').length,
    ROT: results.filter(r => r.ampel === 'ROT').length,
  };

  const reg = Array.isArray(context.regulatory)
    ? context.regulatory.join(', ')
    : context.regulatory || '';

  let txt = `KI-DATENAMPEL · GOVERNANCE REPORT\n`;
  txt += `${'='.repeat(50)}\n\n`;
  txt += `Unternehmenskontext\n`;
  txt += `Branche: ${context.industry || '-'}\n`;
  txt += `Größe: ${context.size || '-'}\n`;
  txt += `Regulierung: ${reg}\n`;
  txt += `KI-Reifegrad: ${context.ai_maturity || '-'}\n`;
  txt += `Governance: ${context.governance || '-'}\n\n`;
  txt += `Ergebnis: ${counts.GRÜN} GRÜN · ${counts.ORANGE} ORANGE · ${counts.ROT} ROT\n\n`;
  txt += `${'─'.repeat(50)}\n\n`;

  results.forEach((r, i) => {
    txt += `${i + 1}. ${r.ampel} · ${r.name}\n`;
    if (r.department) txt += `   Abteilung: ${r.department}\n`;
    if (r.grenzfall) txt += `   ⚠ Grenzfall (Vorsichtsprinzip)\n`;
    txt += `   ${r.begruendung}\n`;
    if (r.massnahmen?.length) {
      txt += `   Maßnahmen:\n`;
      r.massnahmen.forEach(m => txt += `   → ${m}\n`);
    }
    txt += `\n`;
  });

  txt += `${'─'.repeat(50)}\n`;
  txt += `Kein Rechtsrat · Art. 4 EU AI Act · k&n edvkonzepte GmbH\n`;
  txt += `Stand: ${new Date().toLocaleDateString('de-DE')}\n`;

  return txt;
}

/**
 * Sendet den Report per EmailJS
 * Erwartet EmailJS-Template mit den Variablen:
 * {{to_email}}, {{report_summary}}, {{report_detail}}, {{gruen}}, {{orange}}, {{rot}}, {{context_info}}
 */
export async function sendReport(email, results, context) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS nicht konfiguriert. Bitte Umgebungsvariablen setzen.');
  }

  const counts = {
    GRÜN: results.filter(r => r.ampel === 'GRÜN').length,
    ORANGE: results.filter(r => r.ampel === 'ORANGE').length,
    ROT: results.filter(r => r.ampel === 'ROT').length,
  };

  const reg = Array.isArray(context.regulatory)
    ? context.regulatory.join(', ')
    : context.regulatory || '';

  await emailjs.send(serviceId, templateId, {
    to_email: email,
    gruen: counts.GRÜN,
    orange: counts.ORANGE,
    rot: counts.ROT,
    context_info: `${context.industry || ''} · ${context.size || ''} · ${reg}`,
    report_detail: buildReportText(results, context),
    report_summary: `${results.length} Use Cases analysiert: ${counts.GRÜN} GRÜN, ${counts.ORANGE} ORANGE, ${counts.ROT} ROT`,
  }, publicKey);
}
