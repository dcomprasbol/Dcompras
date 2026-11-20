import { describe, expect, it } from "vitest";
import { toSpeech } from "@/lib/narration";

describe("toSpeech (subtítulo → texto para leer en voz alta)", () => {
  it("lee los montos en bolivianos", () => {
    expect(toSpeech("Tus Bs 150,00 se suman a tu billetera.")).toBe("Tus 150,00 bolivianos se suman a tu billetera.");
    expect(toSpeech("Paga Bs 1.250,50")).toBe("Paga 1.250,50 bolivianos");
  });
  it("lee los porcentajes y quita comillas", () => {
    expect(toSpeech("El 1% lo pagó tu cliente.")).toBe("El 1 por ciento lo pagó tu cliente.");
    expect(toSpeech("Tocas «Agendar liquidación»")).toBe("Tocas Agendar liquidación");
  });
});

import { narrationFileId } from "@/lib/narration";
import { allTutorialLines, tutorialScript } from "@/lib/tutorialScript";

describe("archivos de la locución grabada", () => {
  it("cada frase del guion tiene un nombre único y estable", () => {
    const lines = allTutorialLines(1);
    const ids = lines.map(narrationFileId);
    expect(new Set(ids).size).toBe(lines.length);
    expect(narrationFileId(lines[0])).toBe(narrationFileId(lines[0]));
    expect(ids.every((id) => /^[a-z0-9]+-[a-z0-9]+$/.test(id))).toBe(true);
  });
  it("si cambia el texto, cambia el archivo (nunca suena una grabación vieja)", () => {
    expect(narrationFileId("Hola mundo")).not.toBe(narrationFileId("Hola mundo."));
  });
  it("el guion explica que el vendedor elige quién paga el porcentaje", () => {
    for (const payer of ["comprador", "vendedor"] as const) {
      expect(tutorialScript(1, payer).cobro.join(" ")).toMatch(/tú decides quién paga ese 1%/);
    }
  });
});
