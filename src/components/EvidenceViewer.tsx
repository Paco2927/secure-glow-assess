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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!evidenceUrl) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDownload = async () => {
    if (!evidenceUrl) return;
    
    try {
      setIsDownloading(true);
      const response = await fetch(evidenceUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      window.open(evidenceUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
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
          <div className="w-full flex justify-center">
            <img
              src={evidenceUrl}
              alt={`Evidencia de ${controlName}`}
              className="max-w-full max-h-[70vh] h-auto rounded-lg shadow-lg border object-contain"
            />
          </div>
        );
      case "pdf":
        return (
          <div className="flex flex-col items-center space-y-4 w-full">
            <Document
              file={evidenceUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-12">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <div className="text-muted-foreground">Cargando PDF...</div>
                  </div>
                </div>
              }
              error={
                <div className="text-center p-8 space-y-4">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Error al cargar el PDF. El archivo puede estar dañado o el formato no es soportado.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => window.open(evidenceUrl, '_blank')}>
                      Abrir en nueva pestaña
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              }
              className="w-full flex justify-center"
            >
              <Page 
                pageNumber={pageNumber}
                className="shadow-lg border rounded"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={Math.min(800, window.innerWidth - 100)}
              />
            </Document>
            {numPages > 1 && (
              <div className="flex items-center gap-4 bg-muted px-6 py-3 rounded-lg shadow-sm">
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  Página {pageNumber} de {numPages}
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(p => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
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
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Descargando...' : `Descargar ${fileName}`}
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">Evidencia: {controlName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </DialogHeader>
        <div className="flex-1 overflow-auto mt-4 flex flex-col items-center justify-center">
          {renderPreview()}
        </div>
        {fileType !== "document" && (
          <div className="flex-shrink-0 mt-4 flex justify-center border-t pt-4">
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Descargando...' : 'Descargar archivo'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceViewer;
