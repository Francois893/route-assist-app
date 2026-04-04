import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, QrCode } from "lucide-react";

interface MachineQrCodeProps {
  open: boolean;
  onClose: () => void;
  machineId: string;
  machineName: string;
  serialNumber?: string | null;
}

function getMachineUrl(machineId: string) {
  const base = window.location.origin;
  return `${base}/m/${machineId}`;
}

export default function MachineQrCode({ open, onClose, machineId, machineName, serialNumber }: MachineQrCodeProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const url = getMachineUrl(machineId);

  const downloadPNG = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext("2d")!;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      // Label below QR
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(machineName, size / 2, size + 28);
      if (serialNumber) {
        ctx.font = "13px monospace";
        ctx.fillStyle = "#666666";
        ctx.fillText(`S/N: ${serialNumber}`, size / 2, size + 50);
      }

      const link = document.createElement("a");
      link.download = `qr-${machineName.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [machineName, serialNumber]);

  const downloadPDF = useCallback(async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 100] });

    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 512, 512);
      const imgData = canvas.toDataURL("image/png");

      doc.addImage(imgData, "PNG", 10, 5, 60, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(machineName, 40, 72, { align: "center" });
      if (serialNumber) {
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        doc.text(`S/N: ${serialNumber}`, 40, 78, { align: "center" });
      }
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text("Scanner pour accéder à la fiche machine", 40, 85, { align: "center" });

      doc.save(`qr-${machineName.replace(/\s+/g, "_")}.pdf`);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [machineName, serialNumber]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            QR Code — {machineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div ref={svgRef} className="flex justify-center p-4 bg-white rounded-xl border border-border">
            <QRCodeSVG
              value={url}
              size={220}
              level="M"
              includeMargin
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">{machineName}</p>
            {serialNumber && (
              <p className="text-xs font-mono text-muted-foreground">S/N: {serialNumber}</p>
            )}
            <p className="text-xs text-muted-foreground break-all">{url}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={downloadPNG}>
              <Download className="w-4 h-4 mr-1.5" />
              PNG
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadPDF}>
              <FileText className="w-4 h-4 mr-1.5" />
              PDF
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Imprimez et collez ce QR code sur la machine. Le scan ouvrira directement la fiche.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
