import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { klassifiziere } from "../lib/ampelLogik";

const WIZ_QS = [
  { q: "Enthält der Use Case personenbezogene Daten, vollständige Verträge, Preislisten, IP (Zeichnungen, Rezepturen) oder Zugangsdaten?",
    sub: "Kundendaten, Mitarbeiterdaten, Bankdaten, CAD-Daten, Passwörter, API-Keys etc.", rot: true },
  { q: "Trifft das System Entscheidungen über Menschen oder überwacht Verhalten?",
    sub: "Bewerbungen bewerten, Performance-Scoring, Kreditentscheidungen, Bewegungs-/Emotionsmonitoring.", rot: true },
  { q: "Geht es um safety- oder qualitätskritische Prozesse?",
    sub: "Produktionsfreigaben, medizinische Unterstützung, Pharma-QS, sicherheitskritische Steuerung.", rot: true },
  { q: "Sind die Inhalte intern, ohne direkte Personenbezüge, Verträge oder IP?",
    sub: "Protokolle, Statusberichte, SOP-Umformulierungen, CAPA-Texte, RFQ-Entwürfe ohne Zeichnungen.", rot: false },
  { q: "Handelt es sich um allgemeine, unkritische Texte ohne vertrauliche Daten?",
    sub: "E-Mails ohne Namen/Preise, Brainstorming, Textglättung, Übersetzungen öffentlicher Inhalte.", rot: false },
];

function deriveWizardAmpel(answers) {
  for (let i = 0; i < WIZ_QS.length; i++) {
    if (answers[i] === undefined) return null;
    if (answers[i] === "ja" && WIZ_QS[i].rot) return "ROT";
    if (i === 3 && answers[i] === "ja") return "ORANGE";
    if (i === 4 && answers[i] === "ja") return "GRÜN";
    if (i === 4 && answers[i] === "nein") return "ORANGE";
  }
  return null;
}

function Wizard({ onAdd }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");

  const answer = (ans) => {
    const na = [...answers, ans];
    const q = WIZ_QS[step];
    if (ans === "ja" && q.rot) { setAnswers(na); return; }
    if (step < WIZ_QS.length - 1) { setAnswers(na); setStep(step + 1); }
    else setAnswers(na);
  };

  const ampel = deriveWizardAmpel(answers);
  const done = ampel !== null;
  const col = ampel === "GRÜN" ? "green" : ampel === "ORANGE" ? "orange" : "red";

  const reset = () => { setStep(0); setAnswers([]); setName(""); setDept(""); };

  return (
    <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:"3px",padding:"22px"}}>
      {!done ? (
        <>
          <div className="wiz-prog">
            {WIZ_QS.map((_,i) => <div key={i} className={`wiz-pip ${i<step?"done":i===step?"active":""}`}/>)}
          </div>
          <div className="wiz-q">Frage {step+1}: {WIZ_QS[step].q}</div>
          <div className="wiz-sub">{WIZ_QS[step].sub}</div>
          <div className="wiz-opts">
            <div className="wiz-opt" onClick={() => answer("ja")}>Ja, trifft zu <span>→</span></div>
            <div className="wiz-opt" onClick={() => answer("nein")}>Nein, trifft nicht zu <span>→</span></div>
          </div>
        </>
      ) : (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px"}}>
            <div className={`badge ${col}`}><div className="bd"/>{ampel}</div>
            <span style={{fontSize:"12px",color:"var(--text-dim)"}}>Wizard-Voreinschätzung (wird regelbasiert verifiziert)</span>
          </div>
          <div className="fg">
            <label className="label">Name des Use Case *</label>
            <input className="input" placeholder="z.B. Protokoll-Zusammenfassung Teammeeting" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div className="fg">
            <label className="label">Abteilung (optional)</label>
            <input className="input" placeholder="z.B. HR, Einkauf, IT" value={dept} onChange={e=>setDept(e.target.value)}/>
          </div>
          <div style={{display:"flex",gap:"9px"}}>
            <button className="btn btn-p" onClick={() => { onAdd({name, department:dept, wizardAmpel:ampel}); reset(); }} disabled={!name.trim()}>
              Hinzufügen
            </button>
            <button className="btn btn-s" onClick={reset}>Neu starten</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StepUseCases({ useCases, setUseCases, context, setResults, onNext, onBack }) {
  const [tab, setTab] = useState("manual");
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef();

  const add = () => setUseCases(p => [...p, {id:Date.now(), name:"", description:"", department:"", wizardAmpel:null}]);
  const rm = (id) => setUseCases(p => p.filter(u => u.id!==id));
  const upd = (id, f, v) => setUseCases(p => p.map(u => u.id===id ? {...u,[f]:v} : u));
  const addWiz = (uc) => { setUseCases(p => [...p, {id:Date.now(), description:"", ...uc}]); setTab("manual"); };

  const handleFile = useCallback((file) => {
    if (!file) return;
    setErr("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext==="csv") {
      Papa.parse(file, { header:true, skipEmptyLines:true, complete: (res) => {
        const rows = res.data.map((r,i) => ({
          id: Date.now()+i,
          name: r.name||r.Name||r.UseCase||r["Use Case"]||Object.values(r)[0]||"",
          description: r.description||r.Beschreibung||Object.values(r)[1]||"",
          department: r.department||r.Abteilung||Object.values(r)[2]||"",
          wizardAmpel: null,
        })).filter(u=>u.name.trim());
        if (rows.length) { setUseCases(rows); setTab("manual"); }
        else setErr("CSV konnte nicht geparst werden. Erwartet: Spalten name, description, department.");
      }});
    } else if (ext==="xlsx"||ext==="xls") {
      setErr("Excel: Bitte als CSV exportieren (Datei → Speichern unter → CSV UTF-8).");
    } else {
      setErr("Format nicht unterstützt. Bitte CSV hochladen.");
    }
  }, [setUseCases]);

  const valid = useCases.filter(u=>u.name?.trim()).length > 0;

  const analyze = () => {
    const res = useCases.filter(u=>u.name?.trim()).map(uc => ({
      ...uc,
      ...klassifiziere(uc, context),
      literacyAnswers: {},
    }));
    setResults(res);
    onNext();
  };

  return (
    <div className="card">
      <div className="eyebrow">Schritt 2 von 3</div>
      <h1 className="title">Use Cases erfassen</h1>
      <p className="desc">Erfasse die KI-Use-Cases deines Unternehmens. Der 5-Fragen-Wizard hilft bei der Einordnung. Grenzfälle werden konservativ bewertet.</p>

      <div className="notice" style={{marginTop:"22px"}}>
        Hinweis: Bei Grenzfällen wird bewusst die strengere Ampelfarbe vergeben. Das ist keine Fehlfunktion,
        sondern Governance-Konsistenz nach dem Vorsichtsprinzip.
      </div>

      <div className="tabs">
        {[["manual","Manuell"],["wizard","5-Fragen-Wizard"],["upload","CSV-Import"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {err && <div className="err">{err}</div>}

      {tab==="wizard" && <Wizard onAdd={addWiz}/>}

      {tab==="upload" && (
        <div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          <div className={`upload-zone ${drag?"drag":""}`}
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}>
            <div style={{fontSize:"32px",marginBottom:"12px"}}>⬆</div>
            <div style={{fontSize:"14px",fontWeight:"500",marginBottom:"6px"}}>CSV hochladen oder hierher ziehen</div>
            <div style={{fontFamily:"DM Mono, monospace",fontSize:"10px",color:"var(--text-muted)"}}>Format: name, description, department (Kopfzeile erforderlich)</div>
          </div>
        </div>
      )}

      {tab==="manual" && (
        <>
          {useCases.length > 0 && (
            <div className="uc-list">
              {useCases.map((uc,i) => (
                <div key={uc.id} className="uc-entry">
                  <div className="uc-n">{i+1}</div>
                  <div className="uc-f">
                    <input className="input" placeholder="Name des Use Case *" value={uc.name} onChange={e=>upd(uc.id,"name",e.target.value)}/>
                    <div className="uc-row">
                      <input className="input" placeholder="Abteilung" value={uc.department} onChange={e=>upd(uc.id,"department",e.target.value)}/>
                      {uc.wizardAmpel && (
                        <div style={{display:"flex",alignItems:"center"}}>
                          <div className={`badge ${uc.wizardAmpel==="GRÜN"?"green":uc.wizardAmpel==="ORANGE"?"orange":"red"}`}>
                            <div className="bd"/>{uc.wizardAmpel} (Wizard)
                          </div>
                        </div>
                      )}
                    </div>
                    <textarea className="textarea" rows={2} placeholder="Beschreibung (optional, verbessert die Treffsicherheit)" value={uc.description} onChange={e=>upd(uc.id,"description",e.target.value)}/>
                  </div>
                  <button className="uc-rm" onClick={()=>rm(uc.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn-add" onClick={add}>+ Use Case hinzufügen</button>
        </>
      )}

      {valid && <div className="notice" style={{marginTop:"16px"}}>{useCases.filter(u=>u.name?.trim()).length} Use Case(s) bereit</div>}

      <div className="btn-row">
        <button className="btn btn-s" onClick={onBack}>← Zurück</button>
        <button className="btn btn-p" onClick={analyze} disabled={!valid}>Ampeln berechnen →</button>
      </div>
    </div>
  );
}
