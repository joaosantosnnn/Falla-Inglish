import React, { useState } from 'react';
import { 
  Database, Shield, CreditCard, Bell, Award, CheckCircle, 
  Layers, Smartphone, Cloud, ArrowRight, Lock, Eye, AlertCircle
} from 'lucide-react';

export default function ArchitectureCenter() {
  const [activeTab, setActiveTab] = useState<'stack' | 'diagram' | 'gateways' | 'lgpd' | 'publication' | 'capacitor'>('stack');

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-500" />
            Central de Arquitetura & Diretrizes FALLA
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Plano completo de engenharia, stack de desenvolvimento e guias regulatórios de publicação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {[
            { id: 'stack', label: 'Stack Recomendada', icon: Layers },
            { id: 'capacitor', label: 'Conversão Capacitor', icon: Smartphone },
            { id: 'diagram', label: 'Fluxo & Diagramas', icon: Cloud },
            { id: 'gateways', label: 'Meios de Pagamento', icon: CreditCard },
            { id: 'lgpd', label: 'Segurança & LGPD', icon: Shield },
            { id: 'publication', label: 'Publicação nas Lojas', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'stack' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 inline-block mb-3">
                <Smartphone size={20} />
              </span>
              <h3 className="font-bold text-slate-800">Frontend Mobile</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Aplicativo híbrido multiplataforma (iOS e Android).
              </p>
              <ul className="text-xs space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 p-2 rounded">
                  <CheckCircle size={14} /> React Native + Expo (Ecosistema moderno)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Expo Router ou React Navigation
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Tailwind (NativeWind) para estilização
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Lottie React Native (Animações dos mascotes)
                </li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 inline-block mb-3">
                <Database size={20} />
              </span>
              <h3 className="font-bold text-slate-800">Backend & Banco de Dados</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Processamento robusto, escalável e de fácil modelagem.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 p-2 rounded">
                  <CheckCircle size={14} /> Node.js + NestJS (Arquitetura limpa) ou Express
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Firebase Firestore (Flexibilidade NoSQL inicial)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Redis (Cache & Rankings de XP em Tempo Real)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Firebase Auth (OAuth Google/Apple/E-mail)
                </li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs col-span-1 md:col-span-2 lg:col-span-1">
              <span className="p-2 rounded-lg bg-pink-50 text-pink-600 inline-block mb-3">
                <Bell size={20} />
              </span>
              <h3 className="font-bold text-slate-800">Serviços Auxiliares</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Notificações, gateway financeiro e inteligência artificial.
              </p>
              <ul className="text-xs space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-2 text-pink-600 bg-pink-50/50 p-2 rounded">
                  <CheckCircle size={14} /> OneSignal ou Firebase Cloud Messaging (FCM)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Pagar.me ou Asaas (Gateway PIX & Cartão)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> Google Gemini API (Geração inteligente de dúvidas)
                </li>
                <li className="flex items-center gap-2 text-slate-600 p-2">
                  <CheckCircle size={14} /> RevenueCat (Gerenciador de assinaturas in-app)
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
            <AlertCircle className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block font-bold mb-1">Por que escolhemos essa stack para você (Iniciante):</strong>
              O uso de <strong>React Native + Expo</strong> permite que você escreva um único código em TypeScript que roda nativamente tanto em iPhones quanto em dispositivos Android, economizando 50% do esforço de desenvolvimento. Integrar o <strong>Firebase</strong> (Auth e Firestore) resolve autenticação segura e sincronização de dados sem a complexidade de gerenciar servidores de banco de dados SQL complexos no primeiro momento.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagram' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Diagrama de Fluxo de Dados FALLA</h3>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-center text-xs font-semibold">
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg border border-indigo-200">
                  <div className="font-bold">App Mobile (Expo)</div>
                  <div className="text-[10px] font-medium text-indigo-500 mt-1">Interage com aluno</div>
                </div>
                <div className="text-slate-400 flex justify-center rotate-90 md:rotate-0">
                  <ArrowRight size={20} />
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-lg border border-emerald-200">
                  <div className="font-bold">Backend (NodeJS/NestJS)</div>
                  <div className="text-[10px] font-medium text-emerald-500 mt-1">API REST, Validação & Regras</div>
                </div>
                <div className="text-slate-400 flex justify-center rotate-90 md:rotate-0">
                  <ArrowRight size={20} />
                </div>
                <div className="bg-amber-100 text-amber-700 p-3 rounded-lg border border-amber-200">
                  <div className="font-bold">Bancos & Serviços</div>
                  <div className="text-[10px] font-medium text-amber-500 mt-1">Firestore, Redis, Stripe, FCM</div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
                <h4 className="font-bold text-slate-800">Como funciona o fluxo em tempo real (Leaderboard):</h4>
                <ol className="list-decimal pl-5 space-y-1 leading-relaxed">
                  <li>O estudante completa uma lição no <strong>App Mobile</strong> e ganha 20 XP.</li>
                  <li>O App envia uma requisição segura contendo o progresso ao <strong>Backend</strong>.</li>
                  <li>O Backend valida os dados do progresso e atualiza os pontos do usuário no <strong>Firestore</strong>.</li>
                  <li>Ao mesmo tempo, o Backend dispara um incremento de score na estrutura de dados <code>Sorted Set</code> do <strong>Redis</strong> (extremamente rápido para rankings).</li>
                  <li>Quando os usuários abrem a tela de ranking, o app solicita os dados ordenados diretamente do Redis através do Backend em milissegundos.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Recomendação de Gateway de Pagamento para o Brasil</h3>
            <p className="text-xs text-slate-500 mb-4">
              Para cobrar planos de assinatura, oferecer PIX facilitado e aceitar cartão de crédito com alta taxa de aprovação.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-xs">
                  <span className="p-1.5 rounded bg-indigo-50 text-indigo-600"><CreditCard size={14} /></span>
                  Pagar.me (Stone Co.) ou Asaas
                </div>
                <ul className="text-xs space-y-1.5 text-slate-600 leading-relaxed list-disc pl-4">
                  <li><strong>PIX Recorrente</strong>: Envia e-mails ou pushes com o QR Code de cobrança mensal automaticamente.</li>
                  <li><strong>Cartão de Crédito</strong>: Checkout transparente dentro do app mobile, sem tirar o usuário do aplicativo.</li>
                  <li><strong>Gestão de Assinaturas</strong>: Ferramenta integrada de planos mensais, trimestrais e anuais com tentativas de cobrança automáticas em caso de falha.</li>
                </ul>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-xs">
                  <span className="p-1.5 rounded bg-emerald-50 text-emerald-600"><Smartphone size={14} /></span>
                  RevenueCat (Recomendação Mobile)
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Para as compras efetuadas diretamente nas lojas da Apple e Google (In-App Purchases).
                  <strong className="block font-bold text-slate-800 mt-2">Dica valiosa:</strong> 
                  A Apple e o Google exigem que apps que vendem conteúdos digitais (como cursos ou lições de idiomas) utilizem os sistemas de cobrança nativos deles sob pena de rejeição. Usar o <strong>RevenueCat</strong> simplifica a integração do recebimento na App Store e Play Store com apenas poucas linhas de código no React Native.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lgpd' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Conformidade com a LGPD (Lei Geral de Proteção de Dados)</h3>
            <p className="text-xs text-slate-500 mb-4">
              O FALLA lida com dados de menores de idade e pagamentos. A segurança precisa ser prioridade absoluta desde o primeiro dia.
            </p>

            <div className="space-y-3">
              {[
                {
                  title: 'Proteção a Dados de Menores de Idade',
                  desc: 'Se o app for voltado para crianças menores de 12 anos, a LGPD exige consentimento explícito dos pais. Deve ser criada uma tela inicial simples de validação parental (como um teste de matemática rápido) antes de salvar informações ou criar contas.'
                },
                {
                  title: 'Criptografia em Trânsito (HTTPS)',
                  desc: 'Toda a comunicação entre o aplicativo e o backend deve ser feita via protocolo seguro HTTPS com certificado SSL válido. Dados sensíveis de pagamento nunca devem trafegar em texto aberto.'
                },
                {
                  title: 'Tokenização de Cartão de Crédito',
                  desc: 'NUNCA salve o número do cartão, CVV ou data de vencimento no seu próprio banco de dados! O gateway de pagamento (Pagar.me/Stripe) fornece um "Token" seguro que representa o cartão. Você salva apenas este token.'
                },
                {
                  title: 'Termos de Uso e Política de Privacidade',
                  desc: 'Crie uma tela acessível nos ajustes que liste detalhadamente quais dados você coleta (nome, e-mail, XP, estado) e inclua um botão fácil para o usuário deletar sua conta permanentemente (exigência severa da Apple App Store).'
                }
              ].map((item, idx) => (
                <div key={idx} className="border-l-2 border-indigo-500 pl-4 py-1 text-xs">
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'publication' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Roteiro de Publicação (Play Store & App Store)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-lg p-3">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Google Play Store (Android)
                </h4>
                <ul className="space-y-1 list-decimal pl-4 font-medium leading-relaxed">
                  <li>Crie uma conta de Desenvolvedor Google ($25 taxa única).</li>
                  <li>Configure o Painel do App, responda o questionário de classificação de conteúdo (foco infantil ou não).</li>
                  <li>Realize um teste interno ou fechado com pelo menos 20 pessoas por 14 dias (exigência recente para contas novas do Google).</li>
                  <li>Gere o arquivo do app no Expo (<code>eas build -p android</code>) e suba no console.</li>
                </ul>
              </div>

              <div className="border border-slate-100 rounded-lg p-3">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span> Apple App Store (iOS)
                </h4>
                <ul className="space-y-1 list-decimal pl-4 font-medium leading-relaxed">
                  <li>Inscreva-se no Apple Developer Program ($99 anual).</li>
                  <li>Configure as informações de privacidade no App Store Connect.</li>
                  <li>Implemente obrigatoriamente o botão de "Login com a Apple" se o seu app tiver Login com Google.</li>
                  <li>Ofereça um botão visível para "Deletar Conta" dentro das configurações.</li>
                  <li>Compile seu app via CLI do Expo (<code>eas build -p ios</code>) e envie para revisão via TestFlight.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-indigo-900 leading-relaxed font-medium">
              💡 <strong>Alerta para apps de assinatura:</strong> A Apple revisa muito rigorosamente as telas de Paywall (compra). Garanta que os preços mensais e anuais estejam claros, o botão de restaurar compras esteja visível e haja links explícitos para os Termos de Uso (EULA) e Políticas de Privacidade.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'capacitor' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Empacotamento Híbrido com Capacitor</h3>
              <p className="text-xs text-slate-500">
                O Capacitor permite que você pegue toda a base de código React, CSS, animações e lógica do FALLA que construímos e a empacote em um contêiner nativo para rodar diretamente em celulares iOS e Android, sem precisar reescrever tudo do zero.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px] text-indigo-650">🚀 Guia de Execução & Comandos</h4>
              <p className="leading-relaxed">
                Nós já pré-configuramos os scripts de build no <code>package.json</code> e criamos o arquivo de configuração <code>capacitor.config.ts</code>. Para rodar seu aplicativo nativo em um dispositivo real ou simulador, use o fluxo abaixo:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-1.5 overflow-x-auto">
                <div><span className="text-slate-400"># 1. Compila os arquivos estáticos da web (gera a pasta /dist)</span></div>
                <div><span className="text-emerald-400">npm run build</span></div>
                <div><span className="text-slate-400"># 2. Inicializa as plataformas Android e iOS no projeto (caso ainda não tenha feito)</span></div>
                <div><span className="text-emerald-400">npx cap add android</span></div>
                <div><span className="text-emerald-400">npx cap add ios</span></div>
                <div><span className="text-slate-400"># 3. Sincroniza seus arquivos React da pasta /dist para os contêineres nativos</span></div>
                <div><span className="text-emerald-400">npm run cap:sync</span></div>
                <div><span className="text-slate-400"># 4. Abre o projeto no Android Studio ou Xcode para rodar no simulador/dispositivo</span></div>
                <div><span className="text-emerald-400">npx cap open android</span></div>
                <div><span className="text-emerald-400">npx cap open ios</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">📡</span>
                  Notificações Push Reais
                </h4>
                <p className="leading-relaxed mb-3">
                  A simulação atual usa notificações em tela dentro do navegador. Para engajar crianças em dispositivos mobile com notificações push reais em background:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Instale o plugin oficial: <code>npm install @capacitor/push-notifications</code></li>
                  <li>Registre os ouvintes de notificação no seu arquivo de entrada (ex: <code>main.tsx</code>) usando <code>PushNotifications.addListener()</code>.</li>
                  <li>Integre as credenciais do Firebase Cloud Messaging (FCM) ou use plataformas gerenciadoras como o <strong>OneSignal</strong>.</li>
                </ul>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">💾</span>
                  Persistência Local Nativa
                </h4>
                <p className="leading-relaxed mb-3">
                  Para garantir que as crianças não percam suas preciosas vidas e o streak acumulado ao fechar o app, é indispensável usar armazenamento persistente local:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Evite usar apenas o <code>localStorage</code> tradicional, pois o sistema operacional mobile pode limpá-lo arbitrariamente para liberar espaço.</li>
                  <li>Use o plugin oficial <code>@capacitor/preferences</code> para chaves pequenas.</li>
                  <li>Para bancos maiores, utilize o SQLite nativo com o plugin <code>@capacitor-community/sqlite</code> ou sincronize em tempo real com o <strong>Firestore</strong>.</li>
                </ul>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">🎙️</span>
                  Microfone & Reconhecimento de Voz
                </h4>
                <p className="leading-relaxed mb-3">
                  No mobile, para de fato gravar a voz do aluno e enviar para validação inteligente de pronúncia:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Instale plugins como <code>@capacitor-community/voice-recorder</code>.</li>
                  <li>Você precisa solicitar explicitamente a permissão de microfone nativa antes do teste.</li>
                  <li>Adicione a permissão <code>android.permission.RECORD_AUDIO</code> no Android e a chave <code>NSMicrophoneUsageDescription</code> no <code>Info.plist</code> do iOS.</li>
                </ul>
              </div>

              <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">🌐</span>
                  Comunicação Sem Barreiras (CORS & Base URL)
                </h4>
                <p className="leading-relaxed mb-3">
                  No navegador, as chamadas à API são feitas de forma relativa (ex: <code>/api/courses</code>). No celular, isso falhará pois o app roda localmente.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Nós já resolvemos isso estruturalmente! Criamos o parâmetro centralizado <code>API_BASE_URL</code> em <code>types.ts</code>.</li>
                  <li>No mobile, configure a variável <code>VITE_API_BASE_URL</code> com o link HTTPS real do seu servidor de produção em seu ambiente de build.</li>
                  <li>Garanta que o seu servidor backend Express configure o middleware de <code>cors()</code> para autorizar as origens locais do Capacitor (como <code>capacitor://localhost</code> no iOS).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
