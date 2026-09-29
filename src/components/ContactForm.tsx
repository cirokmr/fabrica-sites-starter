'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

type Status = { kind: '' | 'ok' | 'err' | 'sending'; msg: string };

// Único recurso dinâmico do site: envio pelo navegador para o endpoint em
// site.json → contato.formEndpoint (Formsubmit /ajax ou o formulário do Tombo CMS).
// Sem endpoint, o formulário não aparece.
type Resposta = { success?: string | boolean; ok?: boolean; message?: unknown; erro?: unknown };

/** Texto de erro vindo do servidor (o CMS manda `message` amigável em 400/429…). */
const textoDoServidor = (b: Resposta): string => {
  const t = typeof b.message === 'string' && b.message.trim() ? b.message : typeof b.erro === 'string' ? b.erro : '';
  return t.trim().slice(0, 300);
};

export default function ContactForm({ campoMensagem }: { campoMensagem: string }) {
  const [status, setStatus] = useState<Status>({ kind: '', msg: '' });
  const email = site.contato.email ?? '';
  const endpoint = site.contato.formEndpoint;
  if (!endpoint) return null;

  const falha = (ativando: boolean) =>
    ativando
      ? `O formulário ainda está sendo ativado. Enquanto isso, escreva para ${email}.`
      : `Não foi possível enviar agora. Tente de novo${email ? ` ou escreva para ${email}` : ''}.`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get('_honey')) return; // robô preencheu o campo escondido
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    data.set('pagina', location.href); // de qual página veio a mensagem
    setStatus({ kind: 'sending', msg: 'Enviando…' });
    try {
      const res = await fetch(endpoint!, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      const body: Resposta = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 400/413/429…: o CMS explica o motivo (ex.: "Aguarde alguns minutos…")
        setStatus({ kind: 'err', msg: textoDoServidor(body) || falha(false) });
        return;
      }
      // O Formsubmit responde 200 mesmo quando não entrega: o resultado real vem no corpo.
      // O Tombo CMS responde { ok: true } (e também success: true).
      if (String(body.success) !== 'true' && body.ok !== true) {
        setStatus({ kind: 'err', msg: falha(/activat/i.test(typeof body.message === 'string' ? body.message : '')) });
        return;
      }
      form.reset();
      setStatus({ kind: 'ok', msg: 'Mensagem enviada. Obrigado — respondemos em breve.' });
    } catch {
      setStatus({ kind: 'err', msg: falha(false) });
    }
  }

  return (
    <form className="cform" onSubmit={onSubmit} noValidate data-stagger>
      <div className="cform__field">
        <input id="nome" name="nome" type="text" required autoComplete="name" placeholder=" " />
        <label htmlFor="nome">Seu nome</label>
      </div>
      <div className="cform__field">
        <input id="email" name="email" type="email" required autoComplete="email" placeholder=" " />
        <label htmlFor="email">Seu e-mail</label>
      </div>
      <div className="cform__field">
        <textarea id="mensagem" name="mensagem" rows={5} required placeholder=" " />
        <label htmlFor="mensagem">{campoMensagem}</label>
      </div>

      <input type="hidden" name="_subject" value={site.contato.assunto || `Contato pelo site — ${site.nome}`} />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_captcha" value="false" />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="cform__hp" aria-hidden="true" />

      <div className="cform__foot">
        <button type="submit" className="btn" disabled={status.kind === 'sending'} data-magnetic>
          {status.kind === 'sending' ? 'Enviando…' : 'Enviar mensagem'} <span aria-hidden="true">→</span>
        </button>
        <p className="cform__status mono" role="status" aria-live="polite" data-kind={status.kind}>
          {status.kind !== 'sending' && status.msg}
        </p>
      </div>
    </form>
  );
}
