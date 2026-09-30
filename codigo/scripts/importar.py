"""Gera o seed do Supabase a partir da planilha CONTRATOS.xlsx.

Uso:  python3 scripts/importar.py caminho/CONTRATOS.xlsx [AAAA-MM-DD]

A data opcional é o corte: vencimentos sem cor antes dela são tratados como
já lançados (a planilha antiga não pintava tudo). Padrão: dia 1 do mês atual.

Saída (fora do git, ver .gitignore):
  scripts/saida/seed.sql     → colar no SQL Editor do Supabase depois da migration
  scripts/saida/revisar.md   → o que o import não conseguiu decidir sozinho

Regras de cor (ver documentação/03-Manual Técnico):
  verde/azul-claro (tema 9)  → lancado
  laranja (tema 7, FFC000)   → medido
  amarelo (FFFF00)           → pendente
  sem cor                    → aberto
Linha oculta → contrato inativo. Abas ocultas (2020, 2021, "Contratos") são
histórico e não entram. "Contratos Periódicos" foi descartada (30/09/2026).
"""

import datetime
import os
import re
import sys
import uuid

import openpyxl

ABAS = [
    ("Contratos - nova planilha 2023 ", "normal"),
    ("Despesas Waldemar", "waldemar"),
]
# Texto com cara de senha/CPF/número de conta nunca vai para o banco.
SENSIVEL = re.compile(r"[@#]|\d{3}\.\d{3}\.\d{3}|^\d{8,}$")
NS = uuid.UUID("00000000-0000-0000-0000-00000000c0c0")


def cor(c):
    f = c.fill
    if not f or f.fill_type != "solid":
        return None
    k = f.fgColor
    if k.type == "rgb":
        return k.rgb
    if k.type == "theme":
        return ("t", k.theme, round(k.tint, 1))
    return None


def status_da_cor(c):
    k = cor(c)
    if k == "FFFFFF00":
        return "pendente"
    if k == ("t", 7, 0.0) or k == "FFFFC000":
        return "medido"
    if k in (("t", 9, 0.8), ("t", 9, 0.0), "FFE2EFDA", "FF00FF00"):
        return "lancado"
    return "aberto"


def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def ler(caminho):
    wb = openpyxl.load_workbook(caminho)
    for aba, tipo in ABAS:
        ws = wb[aba]
        for row in ws.iter_rows():
            r = row[0].row
            a = row[0].value
            if tipo == "waldemar":
                if r < 2 or not a:
                    continue
                codigo, fornecedor, inicio = None, str(a).strip(), 1
            else:
                if not (isinstance(a, str) and a.strip().startswith("CT/")):
                    continue
                codigo, fornecedor, inicio = a.strip(), str(row[1].value or "").strip(), 2
            venc, notas = {}, []
            for c in row[inicio:]:
                v = c.value
                if isinstance(v, datetime.datetime):
                    venc.setdefault(v.date(), status_da_cor(c))
                elif isinstance(v, str) and v.strip():
                    notas.append(v.strip())
            yield dict(
                id=str(uuid.uuid5(NS, f"{tipo}|{r}")),
                aba=aba.strip(), linha=r, tipo=tipo, codigo=codigo,
                fornecedor=fornecedor, oculto=bool(ws.row_dimensions[r].hidden),
                venc=venc, notas=notas,
            )


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    hoje = datetime.date.today()
    corte = (datetime.date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2
             else hoje.replace(day=1))
    contratos = list(ler(sys.argv[1]))

    cs, ls, revisar = [], [], []
    vistos = {}
    for o in contratos:
        obs = " | ".join(
            n for n in o["notas"] if not n.startswith("http") and not SENSIVEL.search(n)
        )[:500] or None
        situacao = "inativo" if o["oculto"] else "ativo"
        cs.append(f"({q(o['id'])},{q(o['codigo'])},{q(o['fornecedor'])},"
                  f"{q(o['tipo'])},{q(situacao)},{q(obs)})")

        # Periódicos: a data da planilha é o dia do vencimento mensal
        # (decisão de 30/09/2026). Gera os próximos 12 a partir de hoje.
        abertos_antigos = []
        for d, s in sorted(o["venc"].items()):
            if s == "aberto" and d < corte:
                if not o["oculto"]:
                    abertos_antigos.append(d.isoformat())
                s = "lancado"
            ls.append(f"({q(o['id'])},'{d.isoformat()}','{s}')")

        if o["oculto"]:
            continue
        ref = f"{o['codigo'] or '—'} {o['fornecedor']} ({o['aba']}, linha {o['linha']})"
        if o["codigo"]:
            if o["codigo"] in vistos:
                revisar.append(f"- [ ] **Duplicado** {ref} — mesmo código da linha {vistos[o['codigo']]}")
            vistos.setdefault(o["codigo"], o["linha"])
        if abertos_antigos:
            revisar.append(f"- [ ] **Sem cor antes do corte** {ref}: {', '.join(abertos_antigos)} "
                           "→ importado como lançado")
        if not any(d >= hoje for d in o["venc"]):
            revisar.append(f"- [ ] **Ativo sem vencimento futuro** {ref} → concluir, inativar ou "
                           "criar próximo vencimento")

    os.makedirs(os.path.join(os.path.dirname(__file__), "saida"), exist_ok=True)
    base = os.path.join(os.path.dirname(__file__), "saida")
    with open(os.path.join(base, "seed.sql"), "w", encoding="utf-8") as f:
        f.write(f"-- Gerado por scripts/importar.py em {hoje} (corte {corte})\n")
        f.write("begin;\n")
        f.write("insert into public.contratos (id,codigo,fornecedor,tipo,situacao,observacao) values\n")
        f.write(",\n".join(cs) + "\non conflict (id) do nothing;\n")
        # Sem disparar o gatilho de "próximo vencimento" em massa no import.
        f.write("alter table public.lancamentos disable trigger lancamentos_proximo;\n")
        f.write("insert into public.lancamentos (contrato_id,vencimento,status) values\n")
        f.write(",\n".join(ls) + "\non conflict (contrato_id, vencimento) do nothing;\n")
        f.write("alter table public.lancamentos enable trigger lancamentos_proximo;\n")
        f.write("commit;\n")
    with open(os.path.join(base, "revisar.md"), "w", encoding="utf-8") as f:
        f.write(f"# Revisar após import ({hoje}, corte {corte})\n\n" + "\n".join(revisar) + "\n")
    print(f"{len(cs)} contratos, {len(ls)} lançamentos, {len(revisar)} itens para revisar → {base}")


if __name__ == "__main__":
    main()
