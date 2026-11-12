# Login GitHub no painel NixTv (sem Firebase)

O painel suporta login via GitHub OAuth usando um Cloudflare Worker. **O login só ficará ativo após configurar e publicar o Worker.**

1. No GitHub, acesse Settings > Developer settings > OAuth Apps > New OAuth App.
   - Homepage URL: https://nixtv-oficial.github.io
   - Authorization callback URL: https://SEU-WORKER.workers.dev/callback
   - Guarde Client ID e Client Secret (nunca os coloque no repositório).
2. Crie um Cloudflare Worker e publique o conteúdo de `cloudflare/nix-auth-worker.js`.
3. Configure as variáveis do Worker:
   - `GITHUB_CLIENT_ID` (variável ou segredo)
   - `GITHUB_CLIENT_SECRET` (segredo)
   - `SESSION_SECRET` (segredo aleatório forte com 32+ caracteres)
   - `PUBLIC_ORIGIN` = `https://nixtv-oficial.github.io`
   - `ADMIN_GITHUB_LOGIN` = seu nome de usuário GitHub autorizado
4. Em `admin/auth-config.js`, informe a URL do Worker, sem barra no final.
5. Acesse `https://nixtv-oficial.github.io/admin/` e clique em Entrar com GitHub.

**Observações de segurança:** o Worker limita a sessão ao usuário GitHub autorizado e mantém o token OAuth criptografado em cookie HttpOnly. OAuth Apps podem solicitar acesso amplo aos repositórios do usuário; considere criar uma conta dedicada exclusivamente ao repositório da NixTv ou usar um GitHub App de permissões mais restritas. Não use tokens já compartilhados em conversas; revogue-os. Os endpoints de escrita só aceitam a origem configurada, mas a autorização é verificada pelo GitHub.

O código não implanta o Worker automaticamente. O site continua com a identidade NixTv.
