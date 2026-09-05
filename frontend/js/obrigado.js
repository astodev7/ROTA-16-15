(function () {
  'use strict';
  var API_BASE = window.ROTA_API_BASE || (
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : 'https://rotafinalv3-api.vercel.app/api'
  );

  var params = new URLSearchParams(location.search);
  var ref = params.get('ref');
  var payment = params.get('payment');

  var labelEl = document.getElementById('stateLabel');
  var titleEl = document.getElementById('stateTitle');
  var msgEl = document.getElementById('stateMessage');
  var refEl = document.getElementById('orderRef');

  if (!ref) {
    labelEl.textContent = 'PEDIDO';
    titleEl.textContent = 'Nenhum pedido para exibir';
    msgEl.textContent = 'Não encontramos uma referência de pedido nesta página. Se você acabou de finalizar uma compra, confira seu e-mail ou volte para a loja.';
    return;
  }

  refEl.hidden = false;
  refEl.textContent = 'Referência: ' + ref;

  fetch(API_BASE + '/payments/status/' + encodeURIComponent(ref))
    .then(function (res) {
      if (!res.ok) throw new Error('status ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data.paymentStatus === 'approved') {
        labelEl.textContent = 'PAGAMENTO APROVADO';
        titleEl.textContent = 'Pagamento confirmado!';
        msgEl.textContent = 'Seu pedido #' + data.id + ' foi confirmado e já está sendo preparado. Você vai acompanhar as próximas etapas pelo e-mail cadastrado.';
      } else if (data.paymentStatus === 'pending') {
        labelEl.textContent = 'PAGAMENTO PENDENTE';
        titleEl.textContent = 'Pagamento em processamento';
        msgEl.textContent = 'Assim que o Mercado Pago confirmar o pagamento do pedido #' + data.id + ', ele será atualizado automaticamente.';
      } else {
        labelEl.textContent = 'PAGAMENTO NÃO APROVADO';
        titleEl.textContent = 'Não foi possível confirmar o pagamento';
        msgEl.textContent = 'O pagamento do pedido #' + data.id + ' não foi aprovado. Se quiser, volte para a loja e tente novamente.';
      }
    })
    .catch(function () {
      titleEl.textContent = payment === 'success' ? 'Recebemos seu retorno' : 'Não foi possível consultar o pedido';
      msgEl.textContent = 'Confira o status do pagamento diretamente no Mercado Pago ou entre em contato pelo Instagram informando a referência acima.';
    });
})();
