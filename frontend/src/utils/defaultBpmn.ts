export const DEFAULT_THESIS_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_SoutenanceThese" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_SoutenanceThese" name="Soutenance de Thèse" isExecutable="false">
    <bpmn:startEvent id="StartEvent_Depot" name="Dossier déposé">
      <bpmn:outgoing>Flow_Depot_Preparation</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Preparation" name="Préparer le dossier">
      <bpmn:incoming>Flow_Depot_Preparation</bpmn:incoming>
      <bpmn:incoming>Flow_NonConforme_Correction</bpmn:incoming>
      <bpmn:outgoing>Flow_Preparation_Conformite</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Conformite" name="Dossier conforme ?">
      <bpmn:incoming>Flow_Preparation_Conformite</bpmn:incoming>
      <bpmn:outgoing>Flow_Conforme_CFD</bpmn:outgoing>
      <bpmn:outgoing>Flow_NonConforme_Correction</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_CFD" name="Évaluation CFD">
      <bpmn:incoming>Flow_Conforme_CFD</bpmn:incoming>
      <bpmn:outgoing>Flow_CFD_CS</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_CS" name="Décision CS">
      <bpmn:incoming>Flow_CFD_CS</bpmn:incoming>
      <bpmn:outgoing>Flow_CS_Experts</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Experts" name="Expertise externe 45j">
      <bpmn:incoming>Flow_CS_Experts</bpmn:incoming>
      <bpmn:outgoing>Flow_Experts_Jury</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Jury" name="Constituer le jury">
      <bpmn:incoming>Flow_Experts_Jury</bpmn:incoming>
      <bpmn:outgoing>Flow_Jury_Rapports</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Rapports" name="Rapports jury 45j">
      <bpmn:incoming>Flow_Jury_Rapports</bpmn:incoming>
      <bpmn:outgoing>Flow_Rapports_Decision</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Autorisation" name="Soutenance autorisée ?">
      <bpmn:incoming>Flow_Rapports_Decision</bpmn:incoming>
      <bpmn:outgoing>Flow_Autorisee_Soutenance</bpmn:outgoing>
      <bpmn:outgoing>Flow_Reserve_Correction</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Soutenance" name="Soutenance">
      <bpmn:incoming>Flow_Autorisee_Soutenance</bpmn:incoming>
      <bpmn:outgoing>Flow_Soutenance_Archivage</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Archivage" name="Dépôt final et archivage">
      <bpmn:incoming>Flow_Soutenance_Archivage</bpmn:incoming>
      <bpmn:outgoing>Flow_Archivage_Fin</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_Archive" name="Dossier clos">
      <bpmn:incoming>Flow_Archivage_Fin</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Depot_Preparation" sourceRef="StartEvent_Depot" targetRef="Task_Preparation" />
    <bpmn:sequenceFlow id="Flow_Preparation_Conformite" sourceRef="Task_Preparation" targetRef="Gateway_Conformite" />
    <bpmn:sequenceFlow id="Flow_Conforme_CFD" name="Oui" sourceRef="Gateway_Conformite" targetRef="Task_CFD" />
    <bpmn:sequenceFlow id="Flow_NonConforme_Correction" name="Non" sourceRef="Gateway_Conformite" targetRef="Task_Preparation" />
    <bpmn:sequenceFlow id="Flow_CFD_CS" sourceRef="Task_CFD" targetRef="Task_CS" />
    <bpmn:sequenceFlow id="Flow_CS_Experts" sourceRef="Task_CS" targetRef="Task_Experts" />
    <bpmn:sequenceFlow id="Flow_Experts_Jury" sourceRef="Task_Experts" targetRef="Task_Jury" />
    <bpmn:sequenceFlow id="Flow_Jury_Rapports" sourceRef="Task_Jury" targetRef="Task_Rapports" />
    <bpmn:sequenceFlow id="Flow_Rapports_Decision" sourceRef="Task_Rapports" targetRef="Gateway_Autorisation" />
    <bpmn:sequenceFlow id="Flow_Autorisee_Soutenance" name="Oui" sourceRef="Gateway_Autorisation" targetRef="Task_Soutenance" />
    <bpmn:sequenceFlow id="Flow_Reserve_Correction" name="Réserves" sourceRef="Gateway_Autorisation" targetRef="Task_Preparation" />
    <bpmn:sequenceFlow id="Flow_Soutenance_Archivage" sourceRef="Task_Soutenance" targetRef="Task_Archivage" />
    <bpmn:sequenceFlow id="Flow_Archivage_Fin" sourceRef="Task_Archivage" targetRef="EndEvent_Archive" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_SoutenanceThese">
    <bpmndi:BPMNPlane id="BPMNPlane_SoutenanceThese" bpmnElement="Process_SoutenanceThese">
      <bpmndi:BPMNShape id="StartEvent_Depot_di" bpmnElement="StartEvent_Depot">
        <dc:Bounds x="110" y="175" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Preparation_di" bpmnElement="Task_Preparation">
        <dc:Bounds x="210" y="153" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Conformite_di" bpmnElement="Gateway_Conformite" isMarkerVisible="true">
        <dc:Bounds x="410" y="168" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CFD_di" bpmnElement="Task_CFD">
        <dc:Bounds x="530" y="153" width="130" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CS_di" bpmnElement="Task_CS">
        <dc:Bounds x="730" y="153" width="130" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Experts_di" bpmnElement="Task_Experts">
        <dc:Bounds x="930" y="153" width="145" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Jury_di" bpmnElement="Task_Jury">
        <dc:Bounds x="1145" y="153" width="135" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Rapports_di" bpmnElement="Task_Rapports">
        <dc:Bounds x="1350" y="153" width="140" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Autorisation_di" bpmnElement="Gateway_Autorisation" isMarkerVisible="true">
        <dc:Bounds x="1560" y="168" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Soutenance_di" bpmnElement="Task_Soutenance">
        <dc:Bounds x="1695" y="153" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Archivage_di" bpmnElement="Task_Archivage">
        <dc:Bounds x="1885" y="153" width="150" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Archive_di" bpmnElement="EndEvent_Archive">
        <dc:Bounds x="2105" y="175" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Depot_Preparation_di" bpmnElement="Flow_Depot_Preparation">
        <di:waypoint x="146" y="193" />
        <di:waypoint x="210" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Preparation_Conformite_di" bpmnElement="Flow_Preparation_Conformite">
        <di:waypoint x="350" y="193" />
        <di:waypoint x="410" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Conforme_CFD_di" bpmnElement="Flow_Conforme_CFD">
        <di:waypoint x="460" y="193" />
        <di:waypoint x="530" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_NonConforme_Correction_di" bpmnElement="Flow_NonConforme_Correction">
        <di:waypoint x="435" y="218" />
        <di:waypoint x="435" y="300" />
        <di:waypoint x="280" y="300" />
        <di:waypoint x="280" y="233" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_CFD_CS_di" bpmnElement="Flow_CFD_CS">
        <di:waypoint x="660" y="193" />
        <di:waypoint x="730" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_CS_Experts_di" bpmnElement="Flow_CS_Experts">
        <di:waypoint x="860" y="193" />
        <di:waypoint x="930" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Experts_Jury_di" bpmnElement="Flow_Experts_Jury">
        <di:waypoint x="1075" y="193" />
        <di:waypoint x="1145" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Jury_Rapports_di" bpmnElement="Flow_Jury_Rapports">
        <di:waypoint x="1280" y="193" />
        <di:waypoint x="1350" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Rapports_Decision_di" bpmnElement="Flow_Rapports_Decision">
        <di:waypoint x="1490" y="193" />
        <di:waypoint x="1560" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Autorisee_Soutenance_di" bpmnElement="Flow_Autorisee_Soutenance">
        <di:waypoint x="1610" y="193" />
        <di:waypoint x="1695" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Reserve_Correction_di" bpmnElement="Flow_Reserve_Correction">
        <di:waypoint x="1585" y="218" />
        <di:waypoint x="1585" y="360" />
        <di:waypoint x="280" y="360" />
        <di:waypoint x="280" y="233" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Soutenance_Archivage_di" bpmnElement="Flow_Soutenance_Archivage">
        <di:waypoint x="1815" y="193" />
        <di:waypoint x="1885" y="193" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Archivage_Fin_di" bpmnElement="Flow_Archivage_Fin">
        <di:waypoint x="2035" y="193" />
        <di:waypoint x="2105" y="193" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
