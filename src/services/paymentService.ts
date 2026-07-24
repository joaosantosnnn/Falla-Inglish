/**
 * FALLA Payment Service
 * 
 * Este serviço gerencia as transações de compra de moedas e assinaturas.
 * Atualmente, ele simula as respostas de forma assíncrona, mas está totalmente estruturado
 * e documentado para que você possa integrar facilmente gateways de pagamento reais
 * (como Stripe, Mercado Pago, PagSeguro, etc.) no futuro.
 */

export interface PaymentIntentResponse {
  success: boolean;
  transactionId: string;
  message: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceBRL: number;
  badge?: string;
}

export interface SubscriptionPlan {
  id: 'free' | 'premium' | 'family';
  name: string;
  priceBRL: number;
  period: 'mensal' | 'anual' | 'gratuito';
  features: string[];
  color: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coins_100', coins: 100, priceBRL: 4.90 },
  { id: 'coins_500', coins: 500, priceBRL: 19.90, badge: 'Mais Popular' },
  { id: 'coins_1200', coins: 1200, priceBRL: 39.90, badge: 'Melhor Valor (Bonus)' },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    priceBRL: 0,
    period: 'gratuito',
    features: [
      'Acesso às lições básicas de Inglês e Espanhol',
      '5 vidas diárias',
      'Anúncios educativos discretos',
      'Lições personalizadas (limite de 3 por dia)'
    ],
    color: 'border-slate-200 bg-white'
  },
  {
    id: 'premium',
    name: 'FALLA Premium Super',
    priceBRL: 14.90,
    period: 'mensal',
    features: [
      'Tudo do plano gratuito',
      'Vidas infinitas (pratique sem parar!)',
      'Zero anúncios na plataforma',
      'Lições personalizadas ilimitadas',
      'Acesso prioritário a novos idiomas',
      'Selo exclusivo "Estudante Estelar" no Perfil'
    ],
    color: 'border-falla-blue bg-sky-50/50 ring-4 ring-sky-100'
  },
  {
    id: 'family',
    name: 'FALLA Família Hero',
    priceBRL: 29.90,
    period: 'mensal',
    features: [
      'Até 4 contas de estudantes totalmente independentes',
      'Todos os benefícios do plano Premium Super para cada conta',
      'Painel de controle de progresso para Pais e Responsáveis',
      'Desafios cooperativos de mascotes e recompensas multiplicadas',
      'Suporte prioritário via WhatsApp'
    ],
    color: 'border-falla-pink bg-purple-50/50 ring-4 ring-purple-100'
  }
];

class PaymentService {
  /**
   * Simula a assinatura de um plano de benefícios.
   * 
   * INTEGRANDO COM GATEWAY REAL:
   * 1. Inicialize o SDK do gateway (ex: Stripe Checkout / Mercado Pago SDK).
   * 2. Faça uma requisição para a sua rota de API backend (ex: POST /api/payment/create-checkout-session)
   *    enviando o planId.
   * 3. Redirecione o usuário para a página de pagamento seguro do gateway ou abra o modal.
   * 4. No webhook de retorno, atualize o status da assinatura do usuário no Supabase.
   */
  async subscribeToPlan(userId: string, planId: 'free' | 'premium' | 'family'): Promise<PaymentIntentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // --- ADICIONE SUA INTEGRAÇÃO REAL DE GATEWAY AQUI ---
        // Exemplo teórico com Stripe:
        // const response = await fetch('/api/payment/subscribe', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ userId, planId })
        // });
        // return await response.json();
        
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        const amount = plan ? plan.priceBRL : 0;
        
        resolve({
          success: true,
          transactionId: `TX-SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          message: `Assinatura do plano ${plan?.name} ativada com sucesso!`,
          amount,
          currency: 'BRL',
          timestamp: new Date().toISOString()
        });
      }, 1500); // Simula latência de rede de 1.5 segundos
    });
  }

  /**
   * Simula a compra de pacotes de moedas com dinheiro real.
   * 
   * INTEGRANDO COM GATEWAY REAL:
   * 1. Envie o packageId e userId para sua API.
   * 2. Processe a transação via PIX ou Cartão usando o gateway de pagamento escolhido.
   * 3. Confirmando o pagamento pelo Webhook de callback, some o saldo de moedas do usuário.
   */
  async purchaseCoins(userId: string, packageId: string): Promise<PaymentIntentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const coinPkg = COIN_PACKAGES.find(p => p.id === packageId);
        const amount = coinPkg ? coinPkg.priceBRL : 0;
        
        resolve({
          success: true,
          transactionId: `TX-COIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          message: `Compra de ${coinPkg?.coins} moedas realizada com sucesso!`,
          amount,
          currency: 'BRL',
          timestamp: new Date().toISOString()
        });
      }, 1200);
    });
  }
}

export const paymentService = new PaymentService();
