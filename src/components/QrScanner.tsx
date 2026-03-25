import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine, X } from "lucide-react";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QrScanner({ open, onClose, onScan }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const readerId = "qr-reader";

    // Small delay to ensure the DOM element is mounted
    const timeout = setTimeout(() => {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              // Use 85% of the viewfinder so small QR codes are easier to read
              const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.85;
              return { width: size, height: size };
            },
            aspectRatio: 1,
            disableFlip: false,
          },
          (decodedText) => {
            scanner.stop().catch(() => {});
            onScan(decodedText.trim());
          },
          () => {} // ignore scan failures
        )
        .catch((err) => {
          console.error("QR scanner error:", err);
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            Scanner un QR code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-secondary/30"
            style={{ minHeight: 280 }}
          />
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Pointez la caméra vers le QR code du matériel
          </p>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
