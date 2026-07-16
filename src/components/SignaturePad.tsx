// src/components/SignaturePad.tsx
//
// Campo de assinatura via canvas (desenhar/rabiscar com mouse, caneta ou
// dedo). Sem dependência externa. Expõe a assinatura como PNG base64
// (data URL) através do onChange, e null quando está vazio/foi limpo.

import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
  height?: number;
};

export function SignaturePad({ onChange, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasSignatureRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Ajusta o canvas pra resolução real da tela (evita traço borrado em
  // telas de alta densidade de pixels) e acompanha o tamanho do
  // container — usando ResizeObserver em vez do evento "resize" da
  // janela, porque o container pode mudar de tamanho por motivos que
  // não disparam esse evento (grid virando 1 coluna, modal abrindo,
  // sidebar recolhendo etc). É exatamente isso que causava o campo
  // "quebrar" em telas menores.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function resize(width: number) {
      const canvas = canvasRef.current;
      if (!canvas || width <= 0) return;

      const ratio = window.devicePixelRatio || 1;

      // Preserva o desenho existente ao redimensionar
      const prevDataUrl = hasSignatureRef.current ? canvas.toDataURL() : null;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1c1c1c";

      if (prevDataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
        img.src = prevDataUrl;
      }
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) resize(entry.contentRect.width);
    });

    observer.observe(container);

    // Primeira medição, caso o ResizeObserver demore a disparar
    resize(container.clientWidth);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPointRef.current) return;

    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;

    if (!hasSignatureRef.current) {
      hasSignatureRef.current = true;
      setHasSignature(true);
    }
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas && hasSignatureRef.current) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasSignatureRef.current = false;
    setHasSignature(false);
    onChange(null);
  }

  return (
    <div className="w-full min-w-0">
      <div
        ref={containerRef}
        className="w-full min-w-0 overflow-hidden rounded-2xl border-2 border-dashed bg-white"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block max-w-full touch-none"
          style={{ height }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {hasSignature ? "Assinatura capturada" : "Assine com o dedo, caneta ou mouse"}
        </span>

        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-orange-600 hover:underline"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
