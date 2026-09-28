# Checklist de entrega (por cliente)

Copie para o cliente e marque. Nada vai ao ar com item pendente sem justificativa.

## Antes de começar
- [ ] Cliente autorizou por escrito a reconstrução (é dono do conteúdo e do domínio)
- [ ] Temos acesso ao DNS do domínio (ou contato de quem tem)
- [ ] Imagens do site antigo: são do cliente ou têm licença? Senão, trocar por banco de imagens
- [ ] Anotar o e-mail que vai receber o formulário

## Conteúdo
- [ ] Nenhum texto do molde sobrou (`npm run checar` sem erros)
- [ ] Telefone, WhatsApp, e-mail, endereço e horário conferidos com o cliente
- [ ] Nenhum conteúdo inventado (depoimentos, números, anos de mercado)
- [ ] `PENDENCIAS.md` enviado ao cliente

## Técnico
- [ ] `npm run build` sem erros
- [ ] `npm run checar` sem erros
- [ ] PageSpeed (https://pagespeed.web.dev) ≥ 90 em Performance, Acessibilidade, SEO — celular
- [ ] Testado em celular de verdade (menu, WhatsApp, formulário, telefone clicável)
- [ ] Favicon e imagem de compartilhamento (cole o link no WhatsApp e veja a prévia)
- [ ] Página 404 funcionando
- [ ] Formulário enviando para o e-mail certo

## Migração (SEO)
- [ ] Todas as URLs antigas com destino (checar confirma)
- [ ] `seo.url` e `robots.txt` com o domínio final
- [ ] Depois de publicar: testar 3 URLs antigas no navegador → caem na página nova?
- [ ] Sitemap enviado no Google Search Console
- [ ] Analytics instalado (se contratado)

## Entrega
- [ ] Link de prévia aprovado pelo cliente (guardar a mensagem de aprovação)
- [ ] Domínio apontado e HTTPS ativo
- [ ] `cliente.json → status: "publicado"`
- [ ] Proposta de manutenção mensal enviada
