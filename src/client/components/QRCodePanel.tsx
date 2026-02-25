import { QRCodeSVG } from "qrcode.react";

interface QRCodePanelProps {
  sessionCode: string;
  onClose: () => void;
}

export function QRCodePanel({ sessionCode, onClose }: QRCodePanelProps) {
  const joinURL = `${window.location.origin}/?code=${sessionCode}`;

  return (
    <div className="fixed inset-0 z-50 bg-surface/90 flex items-center justify-center">
      <div className="bg-surface-raised rounded-2xl p-8 text-center max-w-sm mx-4">
        <h2 className="text-xl font-bold text-accent-gold mb-2">
          Join this session
        </h2>
        <p className="text-text-secondary text-lg mb-6 font-mono">
          {sessionCode}
        </p>
        <div className="inline-block p-4 bg-surface rounded-xl">
          <QRCodeSVG
            value={joinURL}
            size={240}
            level="M"
            bgColor="#1a1410"
            fgColor="#f5f0e8"
            marginSize={2}
          />
        </div>
        <p className="mt-4 text-text-muted text-sm">
          Scan with your phone camera
        </p>
        <button
          onClick={onClose}
          className="mt-6 min-h-[44px] px-8 rounded-lg bg-interactive text-surface font-bold text-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
