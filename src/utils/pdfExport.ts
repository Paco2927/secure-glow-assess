import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RiskData {
  id: string;
  asset: string;
  risk_description: string;
  threat: string;
  control_reference: string | null;
  assessment?: {
    risk_score: number;
    risk_level: string;
    likelihood: number;
    impact: number;
  };
  treatment?: {
    status: string;
  };
}

interface ExportOptions {
  risks: RiskData[];
  organizationName: string;
  organizationLogo?: string;
  appLogo?: string;
  matrixSize: number;
  companyName?: string;
}

const getRiskLevelText = (level?: string): string => {
  switch (level) {
    case "low": return "Bajo";
    case "medium": return "Medio";
    case "high": return "Alto";
    case "extreme": return "Extremo";
    default: return "Sin evaluar";
  }
};

const getTreatmentStatusText = (status?: string): string => {
  switch (status) {
    case "open": return "Abierto";
    case "in_progress": return "En Progreso";
    case "closed": return "Cerrado";
    case "accepted": return "Aceptado";
    default: return "Sin plan";
  }
};

const getRiskColor = (score: number): [number, number, number] => {
  if (score <= 6) return [34, 197, 94]; // green
  if (score <= 12) return [234, 179, 8]; // yellow
  if (score <= 20) return [249, 115, 22]; // orange
  return [239, 68, 68]; // red
};

export const exportRiskMatrixToPDF = async (options: ExportOptions) => {
  const { risks, organizationName, organizationLogo, appLogo, matrixSize, companyName = "TechSecureAI" } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Add logos
  if (appLogo) {
    try {
      doc.addImage(appLogo, "PNG", 15, 10, 30, 30);
    } catch (error) {
      console.error("Error adding app logo:", error);
    }
  }

  if (organizationLogo) {
    try {
      doc.addImage(organizationLogo, "PNG", pageWidth - 45, 10, 30, 30);
    } catch (error) {
      console.error("Error adding organization logo:", error);
    }
  }

  yPosition = 45;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Matriz de Riesgos", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Risk Matrix Grid
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const cellSize = 28;
  const startX = (pageWidth - (matrixSize + 1) * cellSize) / 2;
  const startY = yPosition;

  // Helper function to get risks in a cell
  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(
      (risk) =>
        risk.assessment?.likelihood === likelihood &&
        risk.assessment?.impact === impact
    );
  };

  // Draw matrix headers and cells
  for (let row = 0; row <= matrixSize; row++) {
    for (let col = 0; col <= matrixSize; col++) {
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;

      // Header cells
      if (row === 0 && col === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, cellSize, cellSize, "F");
        doc.setFontSize(9);
        doc.text("X", x + cellSize / 2, y + cellSize / 2 + 2, { align: "center" });
      } else if (row === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, cellSize, cellSize, "F");
        doc.setFontSize(8);
        doc.text(`Impacto ${col}`, x + cellSize / 2, y + cellSize / 2 + 2, { align: "center" });
      } else if (col === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, cellSize, cellSize, "F");
        doc.setFontSize(8);
        doc.text(`Prob. ${matrixSize - row + 1}`, x + cellSize / 2, y + cellSize / 2 + 2, { align: "center" });
      } else {
        // Data cells
        const likelihood = matrixSize - row + 1;
        const impact = col;
        const score = likelihood * impact;
        const color = getRiskColor(score);
        const cellRisks = getRisksInCell(likelihood, impact);

        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y, cellSize, cellSize, "F");
        
        // Draw score
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`Puntaje: ${score}`, x + cellSize / 2, y + 4, { align: "center" });
        
        // Draw risks in the cell
        if (cellRisks.length > 0) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          let riskY = y + 8;
          
          cellRisks.forEach((risk, index) => {
            if (index < 4) { // Limit to 4 risks per cell to avoid overflow
              const riskText = risk.asset.substring(0, 18); // Truncate long names
              doc.text(riskText, x + cellSize / 2, riskY, { align: "center" });
              riskY += 4;
            }
          });
          
          if (cellRisks.length > 4) {
            doc.text(`+${cellRisks.length - 4} más`, x + cellSize / 2, riskY, { align: "center" });
          }
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }

      // Draw border
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, cellSize, cellSize);
    }
  }

  yPosition = startY + (matrixSize + 1) * cellSize + 10;

  // Legend
  doc.setFontSize(9);
  const legendY = yPosition;
  const legendItems = [
    { text: "Bajo (1-6)", color: [34, 197, 94] },
    { text: "Medio (7-12)", color: [234, 179, 8] },
    { text: "Alto (13-20)", color: [249, 115, 22] },
    { text: "Extremo (21-25)", color: [239, 68, 68] }
  ];

  let legendX = 20;
  legendItems.forEach((item) => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(legendX, legendY, 2, "F");
    doc.text(item.text, legendX + 5, legendY + 1);
    legendX += 45;
  });

  yPosition = legendY + 15;

  // Risk list title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Lista de riesgos registrados de mayor a menor:", 15, yPosition);
  yPosition += 10;

  // Sort risks by score (highest first)
  const sortedRisks = [...risks].sort((a, b) => {
    const scoreA = a.assessment?.risk_score || 0;
    const scoreB = b.assessment?.risk_score || 0;
    return scoreB - scoreA;
  });

  // Risk table
  const tableData = sortedRisks.map((risk) => [
    risk.asset,
    risk.risk_description,
    risk.threat,
    risk.control_reference || "—",
    risk.assessment
      ? `${getRiskLevelText(risk.assessment.risk_level)} (${risk.assessment.risk_score})`
      : "Sin evaluar",
    risk.treatment ? getTreatmentStatusText(risk.treatment.status) : "Sin plan"
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Activo", "Descripción del riesgo", "Amenaza", "Control", "Nivel de riesgo", "Estado de tratamiento"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [100, 100, 100], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 }
    },
    margin: { left: 15, right: 15 }
  });

  // Add date and footer information
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  if (finalY < pageHeight - 30) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString("es-ES");
    doc.text(`La última modificación de esta matriz de riesgos fue el día: ${currentDate}`, 15, finalY + 10);
    
    // Add company information footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerText = `Para más información e información actualizada sobre esta matriz de riesgos, consulte la plataforma ${companyName}.`;
    const footerLines = doc.splitTextToSize(footerText, pageWidth - 30);
    doc.text(footerLines, 15, finalY + 20);
  }

  // Save PDF
  doc.save(`matriz_riesgos_${organizationName.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
};
