# Plano de integracao SMS com AWS SNS

## Fase 1 - Estrutura base
- [x] Criar a pasta `src/services/sms`
- [x] Definir os arquivos principais do modulo
- [x] Separar responsabilidades entre resolver, normalizador, fila, worker e adapter
- [x] Padronizar logs e erros do modulo

## Fase 2 - Resolucao de destinatarios
- [x] Receber apenas `recipientIds` na entrada do service
- [x] Buscar usuarios no cache local quando houver
- [x] Fazer fallback no banco legado quando nao houver cache
- [x] Extrair o telefone bruto do usuario encontrado
- [x] Normalizar o numero para o formato E.164 antes de enfileirar
- [x] Marcar destinatarios invalidos quando a normalizacao falhar

## Fase 3 - Fila e worker
- [x] Criar uma fila de envio para SMS
- [x] Enfileirar somente payloads ja normalizados
- [x] Criar worker independente para processar os envios
- [x] Aplicar timeout e abort no processamento do job
- [x] Garantir que falhas criticas encerrem o job sem travar a API

## Fase 4 - Adapter AWS SNS
- [x] Criar o adapter da AWS SNS para SMS
- [x] Enviar mensagens com `Publish` usando `PhoneNumber`
- [x] Registrar e propagar o `MessageId` retornado pela AWS
- [x] Configurar `AWS_REGION` e credenciais da AWS
- [ ] Permitir definicao de tipo padrao de SMS e outras preferencias

## Fase 5 - Regras de negocio e conformidade
- [ ] Validar limite de tamanho da mensagem
- [ ] Tratar numeros fora de E.164 como erro de dominio
- [ ] Respeitar opt-out do destinatario quando aplicavel
- [ ] Considerar restricoes por pais e regiao
- [ ] Evitar dependencias em sender ID quando o destino nao suportar

## Fase 6 - Integracao com o backend
- [ ] Trocar o `MockSmsProvider` pelo provider real via configuracao
- [ ] Conectar o fluxo de campanhas ao worker de SMS
- [ ] Atualizar o container da aplicacao
- [ ] Manter fallback mock para desenvolvimento e teste

## Fase 7 - Testes e validacao
- [ ] Testar normalizacao de telefone
- [ ] Testar resolucao via cache e via banco legado
- [ ] Testar enfileiramento com payload normalizado
- [ ] Testar o worker com a AWS SNS mockada
- [ ] Testar falhas de numero invalido, opt-out e limite de tamanho

## Fase 8 - Operacao
- [ ] Revisar variaveis de ambiente
- [ ] Revisar permissao IAM para SNS
- [ ] Definir estrategia de observabilidade e logs
- [ ] Validar comportamento em caso de falha do processo
