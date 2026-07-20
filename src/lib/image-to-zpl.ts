// src/lib/image-to-zpl.ts
//
// Converte uma imagem (PNG base64 / data URL) em um bitmap ZPL (^GFA),
// pronto pra embutir direto num campo ^FO...^FS. Usado pra imprimir a
// assinatura do cliente no cupom da Zebra — diferente da logo (que foi
// convertida uma vez só, no meu computador), a assinatura muda a cada
// pedido, então essa conversão roda aqui, no navegador, na hora do print.

export type ZplBitmap = {
  field: string; // o comando ^GFA,... completo, pronto pra embutir
  width: number; // dots
  height: number; // dots
};

/**
 * @param dataUrl PNG base64 (ex: o que vem do <canvas>.toDataURL())
 * @param targetWidth largura desejada no papel, em dots (203dpi = 8 dots/mm)
 * @param threshold 0-255: abaixo disso o pixel vira "preto" (imprime).
 *                  Fundo branco puro + traço escuro (como o SignaturePad
 *                  gera) funciona bem com o padrão.
 */
export async function imageToZplGFA(
  dataUrl: string,
  targetWidth: number,
  threshold = 200,
): Promise<ZplBitmap | null> {
  const img = await loadImage(dataUrl);
  if (!img.width || !img.height) return null;

  const scale = targetWidth / img.width;
  const targetHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fundo branco (caso a imagem tenha transparência) antes de desenhar
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);

  const bytesPerRow = Math.ceil(targetWidth / 8);
  const bytes = new Uint8Array(bytesPerRow * targetHeight);

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const i = (y * targetWidth + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Pixel transparente conta como branco (não imprime)
      const luminance = (r + g + b) / 3;
      const isDark = a > 10 && luminance < threshold;

      if (isDark) {
        const byteIndex = y * bytesPerRow + (x >> 3);
        const bitIndex = 7 - (x % 8);
        bytes[byteIndex] |= 1 << bitIndex;
      }
    }
  }

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const totalBytes = bytes.length;

  return {
    field: `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}`,
    width: targetWidth,
    height: targetHeight,
  };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
