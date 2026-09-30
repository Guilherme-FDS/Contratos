const URL = /(https?:\/\/[^\s|]+)/;
const EH_URL = /^https?:\/\//;

/** Observação do contrato: uma linha por informação, links clicáveis. */
export default function Obs({ texto, className = "" }: { texto: string; className?: string }) {
  const linhas = texto.split(/\n| \| /).map((l) => l.trim()).filter(Boolean);
  return (
    <div className={`space-y-0.5 text-xs text-wegg-600 ${className}`}>
      {linhas.map((l, i) => (
        <p key={i} className="break-all">
          {l.split(URL).map((parte, j) =>
            EH_URL.test(parte) ? (
              <a key={j} href={parte} target="_blank" rel="noopener noreferrer" className="text-wegg-700 underline">
                {parte.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
              </a>
            ) : (
              <span key={j}>{parte}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
