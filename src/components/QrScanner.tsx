import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus, ScanLine } from "lucide-react";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QrScanner({ open, onClose, onScan }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);

  useEffect(() => {
    if (!open) return;

    const readerId = "qr-reader";

    const timeout = setTimeout(() => {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.9;
              return { width: size, height: size };
            },
            aspectRatio: 1,
            disableFlip: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          (decodedText) => {
            scanner.stop().catch(() => {});
            onScan(decodedText.trim());
          },
          () => {}
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

  const handlePhotoScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setError("");
    setIsReadingPhoto(true);

    try {
      await scannerRef.current.stop().catch(() => {});
      const decodedText = await scannerRef.current.scanFile(file, true);
      onScan(decodedText.trim());
    } catch (err) {
      console.error("QR photo scan error:", err);
      setError("Lecture impossible depuis la photo. Essayez en vous rapprochant du QR code.");
    } finally {
      setIsReadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setError("");
    setIsReadingPhoto(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            Scanner un QR code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-secondary/30 min-h-[340px]" />

          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoScan}
              disabled={isReadingPhoto}
            />
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50">
              <ImagePlus className="h-4 w-4" />
              {isReadingPhoto ? "Lecture de la photo..." : "Scanner depuis une photo"}
            </span>
          </label>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <p className="text-xs text-muted-foreground text-center">
            Astuce : pour les petits QR, utilisez "Scanner depuis une photo"
          </p>

          <Button variant="outline" className="w-full" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
