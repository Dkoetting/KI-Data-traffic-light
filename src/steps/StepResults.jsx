import { useState } from "react";
import { sendReport } from "../lib/emailReport";

const COL = { GRÜN:"green", ORANGE:"orange", ROT:"red" };

function litStatus(r) {
  const qs = r.literacyFragen || [];
  if (!qs.length) return "pending";
  const ans = r.literacyAnswers || {};
  if (Object.keys(ans).length < qs.length) return "pending";
  if (r.ampel === "ROT") return "formal";
  return Object.values(ans).every(v => v==="ja") ? "ok" : "training";
}

const LIT_LABEL = { ok:"Literacy OK", training:"Training offen", formal:"Formaler Prozess", pending:"Offen" };

function ResultItem({ r, onChange }) {
  const [open, setOpen] = useState(false);
  const col = COL[r.ampel] || "green";
  const ls = litStatus(r);

  const setAns = (i, v) => onChange({...r, literacyAnswers:{...(r.literacyAnswers||{}), [i]:v}});

  return (
    <div className={`ri-wrap ${col}`}>
      <div className="ri-head" onClick={()=>setOpen(o=>!o)}>
        <div className={`badge ${col}`}><div className="bd"/>{r.ampel}</div>
        <div style={{flex:1}}>
          <div className="ri-name">{r.name}</div>
          {r.department && <div className="ri-dept">{r.department}</div>}
        </div>
        {r.grenzfall && <div className="gf-badge">⚠ Grenzfall</div>}
        <div className={`lit-badge ${ls}`}>{LIT_LABEL[ls]}</div>
        {r.redFlag && <span title="Red Flag" style={{fontSize:"14px",marginLeft:"4px"}}>🚩</span>}
        <div className={`chev ${open?"open":""}`}>▼</div>
      </div>

      {open && (
        <div className="ri-body">
          <div className="rl">Begründung</div>
          <div className="rt">{r.begruendung}</div>
          {r.grenzfall && (
            <div style={{marginTop:"10px",fontFamily:"DM Mono, monospace",fontSize:"10px",color:"var(--orange-l)",padding:"8px 10px",background:"var(--orange-bg)",borderRadius:"2px",border:"1px solid var(--orange-b)"}}>
              Grenzfall: Im Zweifel wurde die strengere Einstufung vergeben (Vorsichtsprinzip).
            </div>
          )}
          {r.massnahmen?.length > 0 && (
            <>
              <div className="rl">Handlungsempfehlungen</div>
              <ul className="rlist">{r.massnahmen.map((m,i)=><li key={i}>{m}</li>)}</ul>
            </>
          )}
          {r.literacyFragen?.length > 0 && (
            <>
              <div className="rl">Art. 4 AI Literacy Check</div>
              <div className="lit-qs">
                {r.literacyFragen.map((lq,i)=>(
                  <div key={i} className="lit-q">
                    <div style={{flex:1}}>
                      <div className="lit-qt">{lq.frage}</div>
                      {r.literacyAnswers?.[i]==="nein" && lq.hint && (
                        <div className="lit-qh">→ {lq.hint}</div>
                      )}
                    </div>
                    <div className="lit-tog">
                      <button className={`lb ja ${r.literacyAnswers?.[i]==="ja"?"a":""}`} onClick={()=>setAns(i,"ja")}>Ja</button>
                      <button className={`lb nein ${r.literacyAnswers?.[i]==="nein"?"a":""}`} onClick={()=>setAns(i,"nein")}>Nein</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function exportCSV(results) {
  const rows = [
    ["Use Case","Abteilung","Ampel","Grenzfall","Begründung","Maßnahmen","Literacy-Status","Red Flag"],
    ...results.map(r => [
      r.name, r.department||"", r.ampel, r.grenzfall?"Ja":"Nein",
      r.begruendung, (r.massnahmen||[]).join(" | "),
      LIT_LABEL[litStatus(r)], r.redFlag?"Ja":"Nein"
    ])
  ];
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="KI-Datenampel-Report.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportLiteracy(results) {
  const today = new Date().toISOString().slice(0,10);
  const rows = [
    ["Use Case","Abteilung","Ampel","Frage","Antwort","Hinweis bei Nein","Datum"],
    ...results.flatMap(r=>(r.literacyFragen||[]).map((lq,i)=>[
      r.name, r.department||"", r.ampel, lq.frage,
      r.literacyAnswers?.[i]||"offen", lq.hint||"", today
    ]))
  ];
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="AI-Literacy-Nachweis-Art4.csv"; a.click();
  URL.revokeObjectURL(url);
}

function EmailGate({ results, context, onUnlock }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errMsg, setErrMsg] = useState("");

  const counts = {
    GRÜN: results.filter(r=>r.ampel==="GRÜN").length,
    ORANGE: results.filter(r=>r.ampel==="ORANGE").length,
    ROT: results.filter(r=>r.ampel==="ROT").length,
  };

  const submit = async () => {
    if (!email.includes("@")) return;
    setStatus("sending");
    try {
      await sendReport(email, results, context);
      setStatus("sent");
    } catch (e) {
      // EmailJS nicht konfiguriert → trotzdem Report anzeigen, Fehler loggen
      console.warn("EmailJS:", e.message);
      setStatus("sent"); // Graceful fallback: Report trotzdem zeigen
    }
    onUnlock();
  };

  return (
    <div className="card">
      <div className="gate">
        <div style={{fontSize:"44px",marginBottom:"18px"}}>📊</div>
        <div className="title" style={{fontSize:"24px"}}>Report bereit</div>
        <p className="desc" style={{margin:"10px auto 28px",maxWidth:"460px"}}>
          {results.length} Use Case{results.length !== 1 ? "s" : ""} analysiert:&nbsp;
          <span style={{color:"var(--green-l)"}}>{counts.GRÜN} GRÜN</span> ·&nbsp;
          <span style={{color:"var(--orange-l)"}}>{counts.ORANGE} ORANGE</span> ·&nbsp;
          <span style={{color:"var(--red-l)"}}>{counts.ROT} ROT</span>
          <br/><br/>
          Gib deine E-Mail-Adresse ein. Der Report wird dir zugeschickt und hier angezeigt.
        </p>

        {errMsg && <div className="err" style={{maxWidth:"420px",margin:"0 auto 16px"}}>{errMsg}</div>}

        <div className="gate-form">
          <input
            className="input"
            type="email"
            placeholder="name@firma.de"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && submit()}
            disabled={status==="sending"}
          />
          <button
            className="btn btn-p"
            disabled={!email.includes("@") || status==="sending"}
            onClick={submit}
          >
            {status==="sending" ? "Sende…" : "Report ansehen"}
          </button>
        </div>

        <div style={{marginTop:"14px",fontFamily:"DM Mono, monospace",fontSize:"9px",color:"var(--text-muted)"}}>
          Kein Newsletter · Keine Weitergabe · Report wird per E-Mail zugestellt
        </div>
      </div>
    </div>
  );
}

export default function StepResults({ results: init, setResults, context, onBack }) {
  const [results, setLocal] = useState(init);
  const [filter, setFilter] = useState("ALLE");
  const [unlocked, setUnlocked] = useState(false);

  const update = (i, r) => { const n=[...results]; n[i]=r; setLocal(n); };

  const counts = {
    GRÜN: results.filter(r=>r.ampel==="GRÜN").length,
    ORANGE: results.filter(r=>r.ampel==="ORANGE").length,
    ROT: results.filter(r=>r.ampel==="ROT").length,
  };
  const grenzfaelle = results.filter(r=>r.grenzfall).length;
  const filtered = filter==="ALLE" ? results : results.filter(r=>r.ampel===filter);

  if (!unlocked) {
    return <EmailGate results={results} context={context} onUnlock={()=>setUnlocked(true)} />;
  }

  return (
    <div>
      <div className="card" style={{marginBottom:"14px"}}>
        <div className="eyebrow">Report · Governance Übersicht</div>
        <h1 className="title">KI-Datenampel Report</h1>
        <p className="desc">
          {context.industry} · {context.size} ·&nbsp;
          {Array.isArray(context.regulatory) ? context.regulatory.join(', ') : context.regulatory}
        </p>
        {grenzfaelle > 0 && (
          <div style={{marginTop:"14px",fontFamily:"DM Mono, monospace",fontSize:"10px",color:"var(--orange-l)",padding:"9px 12px",background:"var(--orange-bg)",borderRadius:"2px",border:"1px solid var(--orange-b)"}}>
            {grenzfaelle} Grenzfall{grenzfaelle>1?"e":""} erkannt. Vorsichtsprinzip angewendet: strengere Kategorie vergeben. Bei Bedarf manuell prüfen.
          </div>
        )}
      </div>

      <div className="r-summary">
        <div className="r-cell g"><div className="r-count">{counts.GRÜN}</div><div className="r-label">Grün</div></div>
        <div className="r-cell o"><div className="r-count">{counts.ORANGE}</div><div className="r-label">Orange</div></div>
        <div className="r-cell r"><div className="r-count">{counts.ROT}</div><div className="r-label">Rot</div></div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"10px"}}>
        <div className="filter-bar">
          {[["ALLE","fa"],["GRÜN","fg"],["ORANGE","fo"],["ROT","fr"]].map(([f,cls])=>(
            <button key={f} className={`fc ${filter===f?cls:""}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"7px"}}>
          <button className="btn btn-s" style={{padding:"7px 14px",fontSize:"9px"}} onClick={()=>exportCSV(results)}>↓ Use Case CSV</button>
          <button className="btn btn-s" style={{padding:"7px 14px",fontSize:"9px"}} onClick={()=>exportLiteracy(results)}>↓ Literacy Art. 4</button>
        </div>
      </div>

      {filtered.map((r,i)=>(
        <ResultItem key={r.id||i} r={r} onChange={u=>update(results.indexOf(r),u)}/>
      ))}

      {counts.ROT > 0 && (
        <div className="notice" style={{marginTop:"20px",borderColor:"var(--red-b)",background:"var(--red-bg)",color:"var(--red-l)"}}>
          🚩 {counts.ROT} ROT-Use Case(s): Kein Einsatz ohne formale Governance-Prüfung. Governance-Owner einbeziehen, Risikoanalyse durchführen, Incident-Plan definieren.
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"28px"}}>
        <button className="btn btn-s" onClick={onBack}>← Zurück</button>
        <div style={{fontFamily:"DM Mono, monospace",fontSize:"9px",color:"var(--text-muted)"}}>
          Kein Rechtsrat · Art. 4 EU AI Act · k&n edvkonzepte GmbH
        </div>
      </div>
    </div>
  );
}
