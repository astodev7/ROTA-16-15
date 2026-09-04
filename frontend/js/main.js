(function () {
  'use strict';

  // Em desenvolvimento, o frontend costuma ser aberto pelo Live Server (ex.: :5500).
  // Nesse caso, /api apontaria para o servidor do Live Server, e não para o backend :3000.
  // Em produção, quando frontend e backend estão no mesmo domínio, usamos /api.
var API_BASE = window.ROTA_API_BASE || (
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://rotafinalv3-api.vercel.app/api'
);
  var CART_KEY = 'rota1615_cart';
  var currentProducts = [];
  var currentFilter = 'todos';

  var icons = {
    camisetas: '<svg viewBox="0 0 100 100" fill="none" stroke="#1A1611" stroke-width="1.4"><path d="M30 20 L10 32 L20 46 L30 40 L30 84 L70 84 L70 40 L80 46 L90 32 L70 20 L60 26 L40 26 Z"/></svg>',
    moletons: '<svg viewBox="0 0 100 100" fill="none" stroke="#1A1611" stroke-width="1.4"><path d="M28 22 L14 34 L24 48 L32 42 L32 86 L68 86 L68 42 L76 48 L86 34 L72 22 C68 28 60 30 50 30 C40 30 32 28 28 22 Z"/><path d="M40 24 Q50 34 60 24" /></svg>',
    bermudas: '<svg viewBox="0 0 100 100" fill="none" stroke="#1A1611" stroke-width="1.4"><path d="M22 16 L78 16 L80 60 L64 60 L60 30 L52 30 L52 60 L48 60 L48 30 L40 30 L36 60 L20 60 Z"/></svg>',
    acessorios: '<svg viewBox="0 0 100 100" fill="none" stroke="#1A1611" stroke-width="1.4"><path d="M20 46 Q50 16 80 46" /><path d="M20 46 L20 56 Q50 70 80 56 L80 46" /><circle cx="50" cy="48" r="3" fill="#1A1611" stroke="none"/></svg>'
  };
  var catLabels = { camisetas:'Camisetas', moletons:'Moletons', bermudas:'Bermudas', acessorios:'Acessórios' };

  function escapeHtml(value) { var d=document.createElement('div'); d.textContent=String(value ?? ''); return d.innerHTML; }
  function formatBRL(value) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)||0); }
  function normalizeProduct(p) { return { id:Number(p.id), name:p.name ?? p.nome, category:p.category ?? p.categoria, price:Number(p.price ?? p.preco), image:p.image ?? p.imagem ?? null, description:p.description ?? p.descricao ?? null, stock:Number(p.stock ?? p.estoque ?? 0) }; }

  /* ============== MENU MOBILE ============== */
  var toggle=document.getElementById('menuToggle'), close=document.getElementById('menuClose'), panel=document.getElementById('mobilePanel');
  function openPanel(){ panel.classList.add('open'); toggle.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; }
  function closePanel(){ panel.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  toggle.addEventListener('click',openPanel); close.addEventListener('click',closePanel);
  panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closePanel);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closePanel();closeCart();}});

  /* ============== PRODUTOS ============== */
  var grid=document.getElementById('productGrid');
  function renderProducts(){
    grid.innerHTML='';
    var visible=currentProducts.filter(function(p){return currentFilter==='todos'||p.category===currentFilter;});
    if(!visible.length){ grid.innerHTML='<p class="collection-empty">Nenhum produto disponível nesta categoria.</p>'; return; }
    visible.forEach(function(p){
      var card=document.createElement('article'); card.className='product-card';
      var media=p.image ? '<img src="'+escapeHtml(p.image)+'" alt="'+escapeHtml(p.name)+'" loading="lazy">' : (icons[p.category]||'');
      var soldOut=p.stock<=0;
      card.innerHTML='<div class="product-media"><span class="cat-tag">'+escapeHtml(catLabels[p.category]||p.category||'Produto')+'</span>'+media+(soldOut?'<span class="stock-tag">Esgotado</span>':'')+'</div>'+ 
        '<div class="product-info"><h3>'+escapeHtml(p.name)+'</h3><p class="p-cat">'+escapeHtml(p.description||catLabels[p.category]||'')+'</p><div class="p-row"><p class="p-price">'+formatBRL(p.price)+'</p><button class="btn btn-outline add-to-cart" data-id="'+p.id+'" '+(soldOut?'disabled':'')+'>'+ (soldOut?'Esgotado':'Adicionar') +'</button></div></div>';
      grid.appendChild(card);
    });
    grid.querySelectorAll('.add-to-cart').forEach(function(btn){btn.addEventListener('click',function(){var p=currentProducts.find(function(x){return x.id===Number(btn.dataset.id);});if(!p||p.stock<1)return;cartAdd(p);btn.textContent='Adicionado ✓';setTimeout(function(){btn.textContent='Adicionar';},1100);});});
  }
  function sanitizeCart(){
    var byId={}; currentProducts.forEach(function(p){byId[String(p.id)]=p;});
    var items=cartRead(); var changed=false;
    items=items.map(function(it){
      var p=byId[String(it.productId)];
      if(!p){changed=true;return null;}
      var qty=Math.min(Math.max(Number(it.qty)||1,1),Math.min(20,p.stock));
      if(qty!==Number(it.qty)){changed=true;}
      return {productId:p.id,name:p.name,category:p.category,price:p.price,image:p.image,qty:qty};
    }).filter(Boolean).filter(function(it){if(it.qty<1){changed=true;return false;}return true;});
    if(changed)cartWrite(items); return items;
  }
  function loadProducts(){
    fetch(API_BASE+'/products').then(function(res){if(!res.ok)throw new Error();return res.json();}).then(function(data){currentProducts=Array.isArray(data)?data.map(normalizeProduct):[];sanitizeCart();renderProducts();renderCart();}).catch(function(){currentProducts=[];sanitizeCart();renderProducts();renderCart();});
  }
  document.querySelectorAll('.filter-btn').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.filter-btn').forEach(function(b){b.setAttribute('aria-pressed','false');});btn.setAttribute('aria-pressed','true');currentFilter=btn.dataset.filter;renderProducts();});});

  /* ============== CARRINHO ============== */
  function cartRead(){try{var raw=localStorage.getItem(CART_KEY),p=raw?JSON.parse(raw):[];return Array.isArray(p)?p:[];}catch(e){return[];}}
  function cartWrite(items){try{if(items.length)localStorage.setItem(CART_KEY,JSON.stringify(items));else localStorage.removeItem(CART_KEY);}catch(e){}}
  function cartAdd(product){var items=sanitizeCart();var existing=items.find(function(it){return String(it.productId)===String(product.id);});if(existing)existing.qty=Math.min(existing.qty+1,Math.min(20,product.stock));else items.push({productId:product.id,name:product.name,category:product.category,price:product.price,image:product.image,qty:1});cartWrite(items);renderCart();}
  function cartSetQty(id,qty){var items=sanitizeCart();var p=currentProducts.find(function(x){return String(x.id)===String(id);});var item=items.find(function(it){return String(it.productId)===String(id);});if(!item)return;if(qty<=0){items=items.filter(function(it){return String(it.productId)!==String(id);});}else{item.qty=Math.min(qty,20,p?p.stock:20);if(item.qty<1)items=items.filter(function(it){return String(it.productId)!==String(id);});}cartWrite(items);renderCart();}
  function cartRemove(id){var items=cartRead().filter(function(it){return String(it.productId)!==String(id);});cartWrite(items);renderCart();}
  function cartClear(){cartWrite([]);renderCart();}

  var cartToggle=document.getElementById('cartToggle'),cartPanel=document.getElementById('cartPanel'),cartOverlay=document.getElementById('cartOverlay'),cartCountEl=document.getElementById('cartCount'),cartItemsEl=document.getElementById('cartItems'),cartEmptyEl=document.getElementById('cartEmpty'),cartFooterEl=document.getElementById('cartFooter'),cartTotalEl=document.getElementById('cartTotal');
  var cartView=document.getElementById('cartView'),checkoutView=document.getElementById('checkoutView'),successView=document.getElementById('successView');
  function openCart(){cartPanel.classList.add('open');cartOverlay.classList.add('open');cartToggle.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';showCartView('cart');}
  function closeCart(){cartPanel.classList.remove('open');cartOverlay.classList.remove('open');cartToggle.setAttribute('aria-expanded','false');document.body.style.overflow='';}
  function showCartView(name){cartView.hidden=name!=='cart';checkoutView.hidden=name!=='checkout';successView.hidden=name!=='success';}
  cartToggle.addEventListener('click',openCart);cartOverlay.addEventListener('click',closeCart);document.getElementById('cartClose').addEventListener('click',closeCart);document.getElementById('cartClose2').addEventListener('click',closeCart);document.getElementById('cartClose3').addEventListener('click',closeCart);

  function renderCart(){
    var items=sanitizeCart(), totalCount=items.reduce(function(s,it){return s+it.qty;},0);cartCountEl.hidden=!totalCount;if(totalCount)cartCountEl.textContent=totalCount;cartItemsEl.innerHTML='';
    if(!items.length){cartEmptyEl.hidden=false;cartFooterEl.hidden=true;return;} cartEmptyEl.hidden=true;cartFooterEl.hidden=false;var total=0;
    items.forEach(function(it){total+=Number(it.price)*it.qty;var media=it.image?'<img src="'+escapeHtml(it.image)+'" alt="'+escapeHtml(it.name)+'">':(icons[it.category]||'');var row=document.createElement('div');row.className='cart-item';row.innerHTML='<div class="cart-item-media">'+media+'</div><div class="cart-item-info"><h4>'+escapeHtml(it.name)+'</h4><p class="cart-item-price">'+formatBRL(it.price)+'</p><div class="qty-stepper"><button class="qty-btn" data-action="dec" data-id="'+it.productId+'">−</button><span>'+it.qty+'</span><button class="qty-btn" data-action="inc" data-id="'+it.productId+'">+</button></div></div><button class="cart-item-remove" data-id="'+it.productId+'" aria-label="Remover '+escapeHtml(it.name)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>';cartItemsEl.appendChild(row);});
    cartTotalEl.textContent=formatBRL(total);
    cartItemsEl.querySelectorAll('.qty-btn').forEach(function(btn){btn.addEventListener('click',function(){var id=btn.dataset.id,item=cartRead().find(function(x){return String(x.productId)===String(id);});if(item)cartSetQty(id,btn.dataset.action==='inc'?Number(item.qty)+1:Number(item.qty)-1);});});
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(function(btn){btn.addEventListener('click',function(){cartRemove(btn.dataset.id);});});
  }
  renderCart();

  /* ============== CHECKOUT + MERCADO PAGO ============== */
  var checkoutForm=document.getElementById('checkoutForm'),checkoutFeedback=document.getElementById('checkoutFeedback'),checkoutSubmit=document.getElementById('checkoutSubmit'),checkoutSummary=document.getElementById('checkoutSummary');
  document.getElementById('goToCheckout').addEventListener('click',function(){var items=sanitizeCart();if(!items.length)return;var total=items.reduce(function(s,i){return s+Number(i.price)*i.qty;},0);checkoutSummary.innerHTML='<div class="checkout-summary-row"><span>'+items.reduce(function(s,i){return s+i.qty;},0)+' item(ns)</span><strong>'+formatBRL(total)+'</strong></div>';setCheckoutFeedback('','');showCartView('checkout');});
  document.getElementById('checkoutBack').addEventListener('click',function(){showCartView('cart');});
  checkoutForm.addEventListener('submit',function(e){
    e.preventDefault();var items=sanitizeCart();if(!items.length)return setCheckoutFeedback('Seu carrinho está vazio.','err');
    var name=document.getElementById('coName').value.trim(),email=document.getElementById('coEmail').value.trim(),phone=document.getElementById('coPhone').value.trim(),address=document.getElementById('coAddress').value.trim();
    if(name.length<2)return setCheckoutFeedback('Digite seu nome completo.','err');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setCheckoutFeedback('Digite um e-mail válido.','err');if(phone.length<8)return setCheckoutFeedback('Digite um telefone válido.','err');if(address.length<6)return setCheckoutFeedback('Digite um endereço de entrega completo.','err');
    checkoutSubmit.disabled=true;setCheckoutFeedback('Criando seu pagamento no Mercado Pago...','');
    fetch(API_BASE+'/payments/checkout',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        items:items.map(function(i){return{productId:Number(i.productId),qty:Number(i.qty)};}),
        customer:{name:name,email:email,phone:phone,address:address}
      })
    })
      .then(async function(res){
        var data={};
        var text=await res.text();
        try{data=text?JSON.parse(text):{};}catch(e){data={message:text||'Resposta inválida do servidor.'};}
        return{ok:res.ok,status:res.status,data:data};
      })
      .then(function(result){
        checkoutSubmit.disabled=false;
        if(!result.ok){
          setCheckoutFeedback(result.data.message||('Erro '+result.status+' ao criar o pedido.'),'err');
          return;
        }
        if(!result.data.initPoint){
          setCheckoutFeedback('O pedido foi criado, mas o Mercado Pago não retornou o link de pagamento. Verifique o Access Token e a configuração do Mercado Pago.','err');
          return;
        }
        cartClear();
        checkoutForm.reset();
        window.location.href=result.data.initPoint;
      })
      .catch(function(error){
        console.error('[Checkout]',error);
        checkoutSubmit.disabled=false;
        setCheckoutFeedback('Não foi possível conectar ao backend. Verifique se o servidor está rodando em http://localhost:3000.','err');
      });
  });
  function setCheckoutFeedback(message,type){checkoutFeedback.textContent=message;checkoutFeedback.className='checkout-feedback'+(type?' '+type:'');}
  document.getElementById('successClose').addEventListener('click',closeCart);

  function handlePaymentReturn(){
    var params=new URLSearchParams(location.search),payment=params.get('payment'),ref=params.get('ref');if(!payment||!ref)return;
    openCart();showCartView('success');var title=payment==='success'?'Pagamento recebido':'Pagamento em processamento';document.querySelector('#successView h2').textContent=title;document.getElementById('successMessage').textContent='Consultando o status do pedido...';
    fetch(API_BASE+'/payments/status/'+encodeURIComponent(ref)).then(function(r){return r.json();}).then(function(data){var msg;if(data.paymentStatus==='approved')msg='Pagamento aprovado! Seu pedido #'+data.id+' foi confirmado.';else if(data.paymentStatus==='pending')msg='Pagamento pendente. Assim que o Mercado Pago confirmar, seu pedido será atualizado.';else msg='O pagamento não foi aprovado. Se precisar, tente novamente.';document.getElementById('successMessage').textContent=msg;}).catch(function(){document.getElementById('successMessage').textContent='Recebemos seu retorno. Confira o status do pagamento no Mercado Pago.';});
    history.replaceState({},document.title,location.pathname);
  }

  /* ============== VIP ============== */
  var vipForm=document.getElementById('vipForm'),vipFeedback=document.getElementById('vipFeedback'),vipSubmit=document.getElementById('vipSubmit');
  function setFeedback(message,type){vipFeedback.textContent=message;vipFeedback.className='vip-feedback'+(type?' '+type:'');}
  vipForm.addEventListener('submit',function(e){e.preventDefault();var name=document.getElementById('vipName').value.trim(),email=document.getElementById('vipEmail').value.trim();if(name.length<2)return setFeedback('Digite seu nome completo.','err');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setFeedback('Digite um e-mail válido.','err');vipSubmit.disabled=true;setFeedback('Enviando...','');fetch(API_BASE+'/vip/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,email:email})}).then(function(res){return res.json().then(function(data){return{ok:res.ok,data:data};});}).then(function(r){vipSubmit.disabled=false;if(r.ok){setFeedback(r.data.message||'Você entrou na lista VIP!','ok');vipForm.reset();}else setFeedback(r.data.message||'Não foi possível concluir o cadastro.','err');}).catch(function(){vipSubmit.disabled=false;setFeedback('Não foi possível conectar ao servidor.','err');});});

  loadProducts();
  handlePaymentReturn();
})();
