# PlusNote

Aplicação web para organização de notas por período, conceitos e matérias.

## Stack

- HTML, CSS e JavaScript puro
- Supabase Auth
- Supabase PostgreSQL + RLS
- Vercel para hospedagem
- Sem build e sem Node.js obrigatório

## Configuração do Supabase

1. Crie/abra um projeto no Supabase.
2. Entre em **SQL Editor > New query**.
3. Cole todo o conteúdo de `supabase.sql` e execute.
4. Em **Authentication > Providers > Email**, desative **Confirm email**. O PlusNote não implementa fluxo de confirmação de email.
5. Em **Project Settings > API**, copie a URL do projeto e a chave pública **anon/publishable**.
6. Abra `supabase.js` e substitua `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
7. Faça commit/push para o GitHub. A Vercel fará um novo deploy automaticamente.

### Segurança

A chave pública anon/publishable pode estar no frontend. Nunca coloque a `service_role` no código do site.

O banco usa Row Level Security (RLS): matérias, conceitos, configurações e notas ficam vinculados ao usuário autenticado.

## Regra de pontuação

O PlusNote **não calcula média aritmética**. O valor exibido como total/média é exclusivamente a **soma das notas cadastradas**. A aprovação ocorre quando essa soma atinge ou supera `Pontos anuais necessários`.

No modo Conceitos, o conceito continua sendo convertido pelo ponto médio entre seu mínimo e máximo, e esses valores são somados, preservando a funcionalidade original.

## Migração

Se uma conta tiver dados antigos salvos em `localStorage` pela versão anterior, o primeiro login tenta migrá-los para o Supabase automaticamente quando ainda não houver dados no banco.
