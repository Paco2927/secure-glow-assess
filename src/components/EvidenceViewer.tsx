import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar worker de PDF.js usando la versión local
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface EvidenceViewerProps {
  evidenceUrl: string | null;
  controlName: string;
}

const EvidenceViewer = ({ evidenceUrl, controlName }: EvidenceViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  if (!evidenceUrl) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const getFileType = (url: string): "image" | "pdf" | "video" | "document" => {
    const extension = url.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
    if (extension === "pdf") return "pdf";
    if (["mp4", "webm", "mov"].includes(extension)) return "video";
    return "document";
  };

  const fileType = getFileType(evidenceUrl);
  const fileName = evidenceUrl.split("/").pop() || "evidencia";

  const renderPreview = () => {
    switch (fileType) {
      case "image":
        return (
          <img
            src={evidenceUrl}
            alt={`Evidencia de ${controlName}`}
            className="max-w-full h-auto rounded-lg"
          />
        );
      case "pdf":
        return (
          <div className="flex flex-col items-center space-y-4">
            <Document
              file={evidenceUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground">Cargando PDF...</div>
                </div>
              }
              error={
                <div className="text-center p-8 space-y-4">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Error al cargar el PDF
                  </p>
                  <Button onClick={() => window.open(evidenceUrl, '_blank')}>
                    Abrir en nueva pestaña
                  </Button>
                </div>
              }
              className="max-w-full"
            >
              <Page 
                pageNumber={pageNumber}
                className="shadow-lg"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
            {numPages > 1 && (
              <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-lg">
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm font-medium">
                  Página {pageNumber} de {numPages}
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(p => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <video
            src={evidenceUrl}
            controls
            className="max-w-full h-auto rounded-lg"
          >
            Tu navegador no soporta la reproducción de videos.
          </video>
        );
      case "document":
        return (
          <div className="text-center p-8 space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Este tipo de archivo no se puede previsualizar en el navegador
            </p>
            <Button asChild>
              <a href={evidenceUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Descargar {fileName}
              </a>
            </Button>
          </div>
        );
    }
  };

  const renderThumbnail = () => {
    if (fileType === "image") {
      return (
        <img
          src={evidenceUrl}
          alt={`Miniatura de ${controlName}`}
          className="w-12 h-12 object-cover rounded border"
        />
      );
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {renderThumbnail()}
          <Eye className="h-4 w-4" />
          Ver evidencia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evidencia: {controlName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderPreview()}
          {fileType !== "document" && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <a href={evidenceUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceViewer;
