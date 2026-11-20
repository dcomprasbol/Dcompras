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
