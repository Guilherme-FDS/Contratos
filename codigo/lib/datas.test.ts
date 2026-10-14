import { describe, expect, it } from "vitest";
import { casaBusca, formatarData, normalizar, textoPrazo } from "./datas";

describe("datas", () => {
  it("formata ISO em dd/mm/aaaa", () => {
    expect(formatarData("2026-10-05")).toBe("05/10/2026");
    expect(formatarData(null)).toBe("—");
  });

  it("descreve o prazo", () => {
    expect(textoPrazo(0)).toBe("vence hoje");
    expect(textoPrazo(10)).toBe("vence em 10 dias");
    expect(textoPrazo(-3)).toBe("venceu há 3 dias");
  });

  it("normaliza acento e caixa", () => {
    expect(normalizar("  Edméia ")).toBe("edmeia");
  });

  it("busca palavras em qualquer ordem", () => {
    const t = "Claro Chapecó Waldemar";
    expect(casaBusca(t, "claro waldemar")).toBe(true);
    expect(casaBusca(t, "wal cha")).toBe(true);
    expect(casaBusca(t, "  CHAPECO  ")).toBe(true);
    expect(casaBusca(t, "claro vivo")).toBe(false);
  });
});
