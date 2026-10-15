# T{estágio}.{nn} — {título curto}

Copie este arquivo para `docs/tasks/E{n}/T{nn}.md`. O CTO preenche o cartão; o agente preenche o relatório; o QA preenche a seção de QA; o revisor, a dele; o CTO fecha com a revisão final.

## Cartão (preenchido pelo CTO)

- **Estágio / tarefa:** E{n} / T{nn} (linha correspondente do `ROADMAP.md`)
- **Agente responsável:** dev-backend | dev-frontend | fixer | qa
- **Revisor:** obrigatório | dispensado (motivo: …). Obrigatório em regra financeira, auth, RLS, banco, migração, sincronização e segurança
- **Depende de (já em `main`):** {tarefas}
- **Branch:** `agent/T{nn}-{papel}`

### Objetivo

{Uma ou duas frases do resultado esperado, do ponto de vista de quem usa.}

### Contexto mínimo

{O que o agente precisa saber e não está óbvio. Seções da spec que valem: ex. 5.4, 8.6. Arquivo de design de referência, se houver.}

### Arquivos permitidos

{Lista de pastas e arquivos que o agente pode editar. Todo o resto é proibido.}

### Contrato (se houver BE e FE em paralelo)

{Tipos e rotas combinados entre os dois.}

### Casos de teste (escritos pelo CTO nas regras financeiras)

{Tabela ou lista: entrada → esperado. O agente escreve esses testes primeiro.}

### Critérios de aceite (testáveis)

- [ ] {critério 1}
- [ ] {critério 2}
- [ ] `pnpm typecheck && pnpm lint && pnpm test` passam

### Fora de escopo

{O que o agente não deve fazer, mesmo que pareça útil.}

### Escalar ao CTO se

{Gatilhos específicos desta tarefa, além dos gerais de `docs/AGENTES.md` seção 9.}

---

## Relatório do agente (preenchido ao terminar)

- **Status:** concluído | concluído com ressalvas | bloqueado
- **Branch / PR:** {nome, link}
- **Arquivos alterados:** {lista, vinda de `git diff --name-only origin/main...HEAD`}
- **Comandos executados e resultado:** {comando → resultado resumido}
- **O que foi feito:** {3 a 6 linhas}
- **Decisões tomadas:** {e por quê}
- **Riscos e dúvidas:** {o que o CTO deve olhar com atenção}
- **Pendências e pedidos:** {dependência nova, mudança de config, mudança de schema, tudo o que o agente não podia fazer}

## Verificação do QA (preenchida pelo qa)

- **Veredito:** PASS | FAIL | NÃO VERIFICADO
- **Comandos executados e resultado:** {comando → resultado}
- **Critérios de aceite:** {um por um: atendido ou não, com evidência}
- **Arquivos fora da área permitida:** {nenhum | lista}
- **Bugs encontrados:** {para cada um: passos para reproduzir, esperado, obtido, gravidade}
- **Testes adicionados:** {arquivos}
- **Não consegui verificar:** {itens e motivo}

## Revisão do revisor (preenchida pelo revisor)

- **Veredito:** APROVADO | ALTERAÇÕES
- **Achados:** {gravidade, arquivo e linha, problema, cenário em que falha, o que fazer}
- **Verifiquei:** {o que leu e rodou}
- **Não consegui verificar:** {itens e motivo}

## Revisão do CTO

- **Decisão:** aprovado | devolvido (rodada 1 ou 2) | escalado ao dono
- **Resumo para o dono (3 a 5 linhas, em português simples):** o que mudou, por que, e o que vale você olhar no diff
- **Observações:** {bugs, regras, segurança, estilo}
