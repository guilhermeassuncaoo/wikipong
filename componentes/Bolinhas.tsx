/**
 * Bolinhas 0–5 do modo Simples (D-08): renderiza paraBolinhas() de metricas.ts.
 * Decorativas (aria-hidden) — quem chama exibe a palavra/valor acessível ao lado.
 */
import { paraBolinhas, type Regua } from '@/src/logica/metricas';
import estilos from './Bolinhas.module.css';

export function Bolinhas({ valor, regua }: { valor: number; regua: Regua | undefined }) {
  const cheias = paraBolinhas(valor, regua);
  /* Régua de terceiro não vira bolinha: um 93 da Megaspin enchia as cinco, e
     cinco cheias em tudo não informam nada. Quem chama mostra o número e o dono
     da régua no lugar. */
  if (cheias === null) return null;
  return (
    <span className={estilos.bolinhas} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < cheias ? estilos.cheia : estilos.vazia} />
      ))}
    </span>
  );
}
