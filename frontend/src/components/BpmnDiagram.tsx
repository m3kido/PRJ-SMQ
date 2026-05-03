import { useEffect, useRef, useState } from "react";
import type BpmnModeler from "bpmn-js/lib/Modeler";
import type BpmnViewer from "bpmn-js/lib/Viewer";
import { useMutation } from "../hooks/useMutation";
import { DEFAULT_THESIS_BPMN_XML } from "../utils/defaultBpmn";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

type BpmnInstance = BpmnModeler | BpmnViewer;

type Props = {
  processId: number;
  xml?: string;
  editable: boolean;
  onSaved?: () => void;
};

function getCanvas(instance: BpmnInstance) {
  return (instance as unknown as { get: (name: string) => { zoom: (mode: string) => void } }).get("canvas");
}

function BpmnDiagram({ processId, xml, editable, onSaved }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<BpmnInstance | null>(null);
  const [message, setMessage] = useState("");
  const { mutate, loading, error } = useMutation();

  const diagramXml = xml?.trim() || DEFAULT_THESIS_BPMN_XML;

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    async function setupDiagram() {
      if (!containerRef.current) return;
      const [{ default: Modeler }, { default: Viewer }] = await Promise.all([
        import("bpmn-js/lib/Modeler"),
        import("bpmn-js/lib/Viewer"),
      ]);

      if (cancelled || !containerRef.current) return;

      const instance: BpmnInstance = editable
        ? new Modeler({ container: containerRef.current })
        : new Viewer({ container: containerRef.current });

      instanceRef.current = instance;
      setMessage("");

      try {
        await instance.importXML(diagramXml);
        getCanvas(instance).zoom("fit-viewport");
      } catch {
        setMessage("Le fichier BPMN ne peut pas être affiché.");
      }
    }

    setupDiagram();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [diagramXml, editable]);

  const importFile = async (file: File | null) => {
    if (!file || !instanceRef.current) return;
    const nextXml = await file.text();
    try {
      await instanceRef.current.importXML(nextXml);
      getCanvas(instanceRef.current).zoom("fit-viewport");
      setMessage("BPMN chargé. Vous pouvez le modifier puis l'enregistrer.");
    } catch {
      setMessage("Le fichier choisi n'est pas un BPMN valide.");
    }
  };

  const resetDiagram = async () => {
    if (!instanceRef.current) return;
    await instanceRef.current.importXML(DEFAULT_THESIS_BPMN_XML);
    getCanvas(instanceRef.current).zoom("fit-viewport");
    setMessage("Modèle BPMN par défaut chargé.");
  };

  const saveDiagram = async () => {
    if (!instanceRef.current) return;
    const { xml: nextXml } = await instanceRef.current.saveXML({ format: true });
    await mutate("patch", `/processes/${processId}/`, { bpmn_xml: nextXml ?? "" });
    setMessage("BPMN enregistré.");
    onSaved?.();
  };

  const downloadDiagram = async () => {
    if (!instanceRef.current) return;
    const { xml: currentXml } = await instanceRef.current.saveXML({ format: true });
    const blob = new Blob([currentXml ?? ""], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cartographie-processus.bpmn";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bpmn-panel">
      <div className="bpmn-panel-head">
        <div>
          <h3 className="section-title">Cartographie BPMN</h3>
          <div className="muted">{editable ? "Importez un .bpmn, ajustez le diagramme, puis enregistrez." : "Visualisation en lecture seule."}</div>
        </div>
        <div className="bpmn-actions">
          {editable && (
            <>
              <label className="tag bpmn-file-button">
                Charger .bpmn
                <input
                  type="file"
                  accept=".bpmn,.xml,application/xml,text/xml"
                  onChange={(event) => importFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button type="button" className="tag" onClick={resetDiagram}>Modèle</button>
              <button type="button" className="btn-primary" onClick={saveDiagram} disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer BPMN"}
              </button>
            </>
          )}
          <button type="button" className="tag" onClick={downloadDiagram}>Télécharger</button>
        </div>
      </div>
      <div ref={containerRef} className={`bpmn-canvas ${editable ? "editable" : "readonly"}`} />
      {(message || error) && <div className="bpmn-message">{error ?? message}</div>}
    </div>
  );
}

export default BpmnDiagram;
