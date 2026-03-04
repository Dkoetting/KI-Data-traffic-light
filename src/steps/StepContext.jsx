const QS = [
  { id: "industry", label: "Branche / Sektor", hint: "Bestimmt den regulatorischen Grundkontext.", type: "select",
    opts: ["Fertigung / Industrie","Finanzdienstleistungen / Versicherung","Gesundheit / MedTech / Pharma","Handel / E-Commerce","IT / Software / Tech","Öffentliche Verwaltung","Beratung / Dienstleistung","Energie / KRITIS","Bildung / Forschung","Sonstige"] },
  { id: "size", label: "Unternehmensgröße", hint: "Relevant für Risikoschwellenwerte.", type: "radio",
    opts: ["< 50 (KMU, klein)","50 – 250 (KMU, mittel)","250 – 1.000","> 1.000 (Konzern)"] },
  { id: "regulatory", label: "Regulatorisches Umfeld", hint: "Mehrfachauswahl möglich. Verschärft die Bewertung bei kritischen Sektoren.", type: "multi",
    opts: ["Standard DSGVO","EU AI Act Hochrisiko-Umfeld","KRITIS / NIS2","Finanzregulierung (BaFin, MiFID)","Medizinrecht / MDR / IVDR"] },
  { id: "ai_maturity", label: "KI-Reifegrad", hint: "Niedrigerer Reifegrad → konservativere Bewertung.", type: "radio",
    opts: ["Einstieg (kein systematischer Einsatz)","Pilotphase (erste Tools im Einsatz)","Fortgeschritten (mehrere Abteilungen)","Strategisch (KI als Kernbestandteil)"] },
  { id: "governance", label: "Vorhandene KI-Governance", hint: "Fehlende Governance → Grenzfälle werden strenger bewertet.", type: "radio",
    opts: ["Nichts vorhanden","Interne Policy (informell)","Formale AI Policy + Freigabeprozess","ISO 42001 / ISMS vorhanden"] },
];

export default function StepContext({ context, setContext, onNext }) {
  const done = QS.every(q => {
    if (q.type === "multi") return (context[q.id] || []).length > 0;
    return !!context[q.id];
  });

  const set = (id, v) => setContext(p => ({...p, [id]: v}));

  const toggleMulti = (id, v) => setContext(p => {
    const cur = p[id] || [];
    return {...p, [id]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]};
  });

  return (
    <div className="card">
      <div className="eyebrow">Schritt 1 von 3</div>
      <h1 className="title">Unternehmenskontext</h1>
      <p className="desc">Die Ampelbewertung ist kontextsensitiv. Grenzfälle werden abhängig von Branche, Regulierung und Governance-Reifegrad konservativ (höhere Farbe) eingestuft.</p>

      <div style={{marginTop:"28px"}}>
        {QS.map(q => (
          <div key={q.id} className="fg">
            <label className="label">{q.label}</label>
            <span className="hint">{q.hint}</span>
            {q.type === "select" ? (
              <select className="select" value={context[q.id]||""} onChange={e => set(q.id, e.target.value)}>
                <option value="">Bitte auswählen…</option>
                {q.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : q.type === "multi" ? (
              <div className="rg">
                {q.opts.map(o => {
                  const selected = (context[q.id] || []).includes(o);
                  return (
                    <div key={o} className={`ro ${selected ? "sel" : ""}`} onClick={() => toggleMulti(q.id, o)}>
                      <div className="cb" style={{
                        width:"13px", height:"13px", border:`2px solid ${selected ? "var(--accent)" : "var(--border2)"}`,
                        borderRadius:"2px", flexShrink:0, background: selected ? "var(--accent)" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s"
                      }}>
                        {selected && <span style={{fontSize:"9px",color:"#080808",fontWeight:"700",lineHeight:1}}>✓</span>}
                      </div>
                      {o}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rg">
                {q.opts.map(o => (
                  <div key={o} className={`ro ${context[q.id]===o?"sel":""}`} onClick={() => set(q.id, o)}>
                    <div className="ri"/>{o}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn btn-p" onClick={onNext} disabled={!done}>Use Cases erfassen →</button>
      </div>
    </div>
  );
}
