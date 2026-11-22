/* Onde está o dado da sua pauta — interações (JS puro, sem dependências). O conteúdo funciona sem JS. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var raiz = doc.getAttribute("data-raiz") || "";
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
  function gravar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) { /* sem armazenamento */ } }
  function norm(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function escapar(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- tema claro/escuro */
  function temaAtual() {
    var t = doc.dataset.theme;
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  $$("[data-alternar-tema]").forEach(function (b) {
    function rotular() { b.setAttribute("aria-label", temaAtual() === "escuro" ? "Mudar para o modo claro" : "Mudar para o modo escuro"); }
    rotular();
    b.addEventListener("click", function () {
      var novo = temaAtual() === "escuro" ? "claro" : "escuro";
      doc.dataset.theme = novo; gravar("tema", novo); rotular();
    });
  });

  /* ---------- menu gaveta (celular) */
  var gaveta = $("#menu-gaveta");
  $$("[data-abrir-menu]").forEach(function (b) {
    b.addEventListener("click", function () {
      var abrir = gaveta.hidden;
      gaveta.hidden = !abrir;
      b.setAttribute("aria-expanded", String(abrir));
      b.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    });
  });

  /* ---------- busca global */
  var dlg = $("#busca"), campo = $("#busca-campo"), lista = $("#busca-resultados"), selecionado = -1;
  function abrirBusca() {
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    campo.value = ""; render(""); setTimeout(function () { campo.focus(); }, 30);
  }
  function destacar(texto, termos) {
    var out = escapar(texto);
    termos.forEach(function (t) {
      if (t.length < 2) return;
      var n = norm(out), i = n.indexOf(t);
      if (i >= 0) out = out.slice(0, i) + "<mark>" + out.slice(i, i + t.length) + "</mark>" + out.slice(i + t.length);
    });
    return out;
  }
  function render(q) {
    var termos = norm(q).split(/\s+/).filter(Boolean);
    selecionado = -1;
    campo.removeAttribute("aria-activedescendant");
    var status = $("[data-busca-status]");
    function fim(n) { campo.setAttribute("aria-expanded", String(n > 0)); if (status) status.textContent = q ? (n ? n + " resultados" : "Nenhum resultado") : ""; }
    if (!termos.length) { lista.innerHTML = ""; fim(0); return; }
    var dados = window.BUSCA || [];
    var res = dados.map(function (it) {
      var titulo = norm(it.t), pontos = 0;
      for (var k = 0; k < termos.length; k++) {
        var t = termos[k];
        if (it.x.indexOf(t) < 0 && titulo.indexOf(t) < 0) return null;
        pontos += titulo.indexOf(t) >= 0 ? 10 : 1;
        if (it.s.indexOf("Pauta") === 0) pontos += 2;
      }
      return { it: it, p: pontos };
    }).filter(Boolean).sort(function (a, b) { return b.p - a.p; }).slice(0, 25);
    fim(res.length);
    if (!res.length) { lista.innerHTML = '<li class="busca-vazio" role="presentation">Nada encontrado para “' + escapar(q) + '”. Tente outra palavra, mais curta.</li>'; return; }
    lista.innerHTML = res.map(function (r, i) {
      var it = r.it, href = it.e ? it.u : raiz + it.u;
      var alvo = it.e ? ' target="_blank" rel="noopener"' : "";
      return '<li role="option" id="res-' + i + '"><a href="' + escapar(href) + '"' + alvo + '><span class="r-sec">' + escapar(it.s) +
        '</span><span class="r-tit">' + destacar(it.t, termos) + '</span><span class="r-txt">' + destacar(it.r || "", termos) + "</span></a></li>";
    }).join("");
  }
  function mover(d) {
    var itens = $$("[role=option]", lista);
    if (!itens.length) return;
    if (selecionado >= 0) itens[selecionado].removeAttribute("aria-selected");
    selecionado = (selecionado + d + itens.length) % itens.length;
    itens[selecionado].setAttribute("aria-selected", "true");
    itens[selecionado].scrollIntoView({ block: "nearest" });
    campo.setAttribute("aria-activedescendant", itens[selecionado].id);
  }
  if (dlg) {
    $$("[data-abrir-busca]").forEach(function (b) { b.addEventListener("click", abrirBusca); });
    campo.addEventListener("input", function () { render(campo.value); });
    campo.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); mover(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); mover(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var itens = $$("[role=option] a", lista);
        var alvo = itens[selecionado >= 0 ? selecionado : 0];
        if (alvo) alvo.click();
      }
    });
    lista.addEventListener("click", function (e) { if (e.target.closest("a") && dlg.close) dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && tag !== "input" && tag !== "textarea") { e.preventDefault(); abrirBusca(); }
    });
  }

  /* ---------- filtros das pautas (página inicial) */
  var cards = $$(".card-pauta");
  if (cards.length) {
    var fUf = null, fTema = null;
    var contador = $("[data-contador]"), semRes = $("[data-sem-resultado]"), limpar = $$("[data-limpar-filtros]");
    function aplicar() {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!fUf || c.dataset.uf === fUf) && (!fTema || (" " + c.dataset.temas + " ").indexOf(" " + fTema + " ") >= 0);
        c.hidden = !ok; if (ok) n++;
      });
      contador.textContent = n;
      semRes.hidden = n !== 0;
      limpar.forEach(function (b) { if (!b.closest("[data-sem-resultado]")) b.hidden = !(fUf || fTema); });
      $$("[data-filtro-uf]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filtroUf === fUf)); });
      $$("[data-filtro-tema]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filtroTema === fTema)); });
    }
    $$("[data-filtro-uf]").forEach(function (b) { b.addEventListener("click", function () { fUf = fUf === b.dataset.filtroUf ? null : b.dataset.filtroUf; aplicar(); }); });
    $$("[data-filtro-tema]").forEach(function (b) { b.addEventListener("click", function () { fTema = fTema === b.dataset.filtroTema ? null : b.dataset.filtroTema; aplicar(); }); });
    limpar.forEach(function (b) { b.addEventListener("click", function () { fUf = fTema = null; aplicar(); }); });
  }

  /* ---------- compartilhar pauta */
  $$("[data-compartilhar]").forEach(function (box) {
    var titulo = box.dataset.titulo, url = location.href.split("#")[0];
    var texto = titulo + " · Guia de fontes da Caravana Abraji/IDEM: " + url;
    var wa = $("[data-whatsapp]", box);
    if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(texto);
    var copiar = $("[data-copiar]", box), rot = $("[data-copiar-texto]", box);
    if (copiar) copiar.addEventListener("click", function () {
      function feito() { rot.textContent = "Link copiado!"; setTimeout(function () { rot.textContent = "Copiar link"; }, 2000); }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(feito, function () { prompt("Copie o link:", url); });
      else prompt("Copie o link:", url);
    });
    var nativo = $("[data-nativo]", box);
    if (nativo && navigator.share) {
      nativo.hidden = false;
      nativo.addEventListener("click", function () { navigator.share({ title: titulo, text: titulo, url: url }).catch(function () {}); });
    }
  });

  /* ---------- copiar modelo de pedido (LAI) */
  $$("[data-copiar-texto-de]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.parentElement.querySelector("p:not(.rot)");
      var t = p ? p.textContent.trim() : "";
      function feito() { var o = b.textContent; b.textContent = "Modelo copiado!"; setTimeout(function () { b.textContent = o; }, 2000); }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(feito, function () { prompt("Copie o modelo:", t); });
      else prompt("Copie o modelo:", t);
    });
  });

  /* ---------- índice das bases (celular) */
  $$("[data-ir-para]").forEach(function (s) {
    s.addEventListener("change", function () { if (s.value) { location.hash = s.value; s.value = ""; } });
  });

  /* ---------- lista de checagem */
  var checklist = $("[data-checklist]");
  if (checklist) {
    var caixas = $$("input[data-check]", checklist), chave = "checagem-v1";
    var salvo = {};
    try { salvo = JSON.parse(ler(chave) || "{}"); } catch (e) { salvo = {}; }
    var barra = $("[data-progresso]"), txt = $("[data-progresso-texto]");
    function atualizar() {
      var n = caixas.filter(function (c) { return c.checked; }).length;
      barra.style.width = (100 * n / caixas.length) + "%";
      txt.textContent = n + " de " + caixas.length;
    }
    caixas.forEach(function (c) {
      c.checked = !!salvo[c.dataset.check];
      c.addEventListener("change", function () { salvo[c.dataset.check] = c.checked; gravar(chave, JSON.stringify(salvo)); atualizar(); });
    });
    $$("[data-limpar-checklist]").forEach(function (b) {
      b.addEventListener("click", function () { salvo = {}; caixas.forEach(function (c) { c.checked = false; }); gravar(chave, "{}"); atualizar(); });
    });
    atualizar();
  }

  /* ---------- filtrar tabela de endereços */
  $$("[data-filtrar-tabela]").forEach(function (inp) {
    var tabela = document.getElementById(inp.dataset.filtrarTabela), cont = $("[data-contador-end]");
    var linhas = $$("tbody tr", tabela);
    inp.addEventListener("input", function () {
      var q = norm(inp.value), n = 0;
      linhas.forEach(function (tr) { var ok = norm(tr.textContent).indexOf(q) >= 0; tr.hidden = !ok; if (ok) n++; });
      if (cont) cont.textContent = n;
    });
  });
})();
