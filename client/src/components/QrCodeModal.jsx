import { QRCodeCanvas } from 'qrcode.react';
import Modal from './Modal';

export default function QrCodeModal({ open, onClose, table }) {
  if (!table) return null;

  const url = `${window.location.origin}/order/${table._id}`;
  const canvasId = `qr-${table._id}`;

  const getCanvas = () => document.getElementById(canvasId);

  const download = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${table.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const printQr = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank', 'width=480,height=640');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>QR ${table.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              min-height: 100vh; gap: 16px; color: #1A0F00;
            }
            img { width: 280px; height: 280px; }
            .table { font-size: 32px; font-weight: 800; }
            .hint { font-size: 18px; color: #C8922A; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="table">${table.name}</div>
          <img src="${dataUrl}" alt="QR" />
          <div class="hint">Quét để gọi món</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Mã QR — ${table.name}`}>
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-2xl border border-brdr">
          <QRCodeCanvas
            id={canvasId}
            value={url}
            size={220}
            level="M"
            fgColor="#2C1A0E"
            bgColor="#FFFFFF"
            includeMargin
          />
        </div>
        <p className="text-xs text-text-muted mt-3 break-all text-center">{url}</p>
        <p className="text-sm text-text-primary mt-2 font-medium">Quét để gọi món tự phục vụ</p>

        <div className="flex gap-3 mt-5 w-full">
          <button className="btn-secondary flex-1" onClick={download}>
            Tải QR
          </button>
          <button className="btn-primary flex-1" onClick={printQr}>
            In QR
          </button>
        </div>
      </div>
    </Modal>
  );
}
