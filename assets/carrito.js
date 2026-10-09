'use strict';
// Las presentaciones y precios se editan SOLO en configuracion-productos.js
const MONARCA_PRECIOS = window.MONARCA_PRODUCTOS || {};
const MONARCA_WHATSAPP = '59176720177';
const MONARCA_STORAGE = 'monarca-carrito-presentaciones-v2';
const precioBs = monto => 'Bs ' + monto.toFixed(2).replace('.', ',');
const esPrecio = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const claveProducto = (nombre, ml) => JSON.stringify([nombre, String(ml)]);
function obtenerProducto(clave) {
  try {
    const [nombre, ml] = JSON.parse(clave);
    const precio = MONARCA_PRECIOS[nombre]?.[ml];
    return esPrecio(precio) ? { nombre, ml, precio } : null;
  } catch (_) { return null; }
}
function nodo(etiqueta, clase, contenido) {
  const n = document.createElement(etiqueta);
  if (clase) n.className = clase;
  if (contenido !== undefined) n.textContent = contenido;
  return n;
}
let carrito = {};
try {
  const dato = JSON.parse(localStorage.getItem(MONARCA_STORAGE) || '{}');
  if (dato && typeof dato === 'object' && !Array.isArray(dato)) {
    for (const [clave, cantidad] of Object.entries(dato)) {
      if (obtenerProducto(clave) && Number.isInteger(cantidad) && cantidad > 0) carrito[clave] = Math.min(99, cantidad);
    }
  }
} catch (_) { /* ignorar almacenamiento dañado */ }
function guardar() {
  try { localStorage.setItem(MONARCA_STORAGE, JSON.stringify(carrito)); } catch (_) {}
}
function cambiarCantidad(clave, delta) {
  if (!obtenerProducto(clave)) return;
  const cantidad = Math.max(0, Math.min(99, (carrito[clave] || 0) + delta));
  if (cantidad) carrito[clave] = cantidad;
  else delete carrito[clave];
  guardar(); mostrarCarrito();
}
function mostrarCarrito() {
  const lista = document.getElementById('monarca-cart-list');
  lista.replaceChildren();
  let total = 0, unidades = 0;
  for (const [clave, cantidad] of Object.entries(carrito)) {
    const producto = obtenerProducto(clave);
    if (!producto || !cantidad) continue;
    total += producto.precio * cantidad;
    unidades += cantidad;
    const linea = nodo('div', 'monarca-cart-line');
    const info = nodo('div', 'monarca-cart-line-info');
    info.append(nodo('strong', '', `${producto.nombre} — ${producto.ml} mL`),
                nodo('small', '', `${cantidad} × ${precioBs(producto.precio)} = ${precioBs(cantidad * producto.precio)}`));
    const controles = nodo('div', 'monarca-quantity');
    const menos = nodo('button', '', '−');
    menos.type = 'button'; menos.setAttribute('aria-label', `Quitar ${producto.nombre} ${producto.ml} mL`);
    menos.addEventListener('click', () => cambiarCantidad(clave, -1));
    const mas = nodo('button', '', '+');
    mas.type = 'button'; mas.disabled = cantidad >= 99;
    mas.setAttribute('aria-label', `Agregar ${producto.nombre} ${producto.ml} mL`);
    mas.addEventListener('click', () => cambiarCantidad(clave, 1));
    controles.append(menos, nodo('span', '', String(cantidad)), mas);
    info.append(controles);
    const quitar = nodo('button', 'monarca-remove', 'Eliminar');
    quitar.type = 'button';
    quitar.addEventListener('click', () => { delete carrito[clave]; guardar(); mostrarCarrito(); });
    linea.append(info, quitar); lista.append(linea);
  }
  if (!unidades) lista.append(nodo('p', '', 'Tu carrito está vacío.'));
  document.getElementById('monarca-cart-count').textContent = String(unidades);
  document.getElementById('monarca-cart-total').textContent = precioBs(total);
  document.getElementById('monarca-checkout').disabled = !unidades;
}
function confirmarPedido() {
  const items = Object.entries(carrito).map(([clave, cantidad]) => ({ ...obtenerProducto(clave), cantidad })).filter(p => p.nombre && p.cantidad > 0);
  if (!items.length) return;
  const total = items.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const detalle = items.map(p => `• ${p.nombre} (${p.ml} mL) × ${p.cantidad}: ${precioBs(p.precio * p.cantidad)}`).join('\n');
  const mensaje = `Hola Monarca, quisiera consultar por este pedido:\n\n${detalle}\n\nTotal: ${precioBs(total)}\n\n¿Me confirman disponibilidad, precios y entrega?`;
  window.open('https://wa.me/' + MONARCA_WHATSAPP + '?text=' + encodeURIComponent(mensaje), '_blank', 'noopener,noreferrer');
}
function iniciar() {
  const panel = nodo('aside', 'monarca-cart-panel');
  panel.id = 'monarca-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Carrito de compras');
  document.querySelectorAll('#productos .product-card').forEach(tarjeta => {
    const titulo = tarjeta.querySelector('.product-info h3');
    const info = tarjeta.querySelector('.product-info');
    if (!titulo || !info) return;
    const nombre = titulo.textContent.trim();
    const precios = MONARCA_PRECIOS[nombre];
    if (!precios) return;
    const comprar = nodo('div', 'monarca-buy monarca-buy-variants');
    const etiqueta = nodo('label', 'monarca-variant-label', 'Presentación');
    const selector = nodo('select', 'monarca-size-select');
    const selectorId = 'monarca-variant-' + Array.from(document.querySelectorAll('#productos .product-card')).indexOf(tarjeta);
    selector.id = selectorId; etiqueta.htmlFor = selectorId;
    for (const ml of Object.keys(precios)) {
      const opcion = nodo('option', '', `${ml} mL${esPrecio(precios[ml]) ? '' : ' — No disponible'}`);
      opcion.value = ml; opcion.disabled = !esPrecio(precios[ml]); selector.append(opcion);
    }
    const primero = Object.keys(precios).find(ml => esPrecio(precios[ml]));
    if (primero) selector.value = primero;
    const precio = nodo('strong', 'monarca-price');
    const boton = nodo('button', 'monarca-add', '🛒 Agregar al carrito');
    boton.type = 'button';
    function actualizarPrecio() {
      const valor = precios[selector.value];
      precio.textContent = esPrecio(valor) ? precioBs(valor) : 'No disponible';
      boton.disabled = !esPrecio(valor);
    }
    selector.addEventListener('change', actualizarPrecio);
    boton.addEventListener('click', () => {
      cambiarCantidad(claveProducto(nombre, selector.value), 1);
      panel.hidden = false;
    });
    comprar.append(etiqueta, selector, precio, boton);
    info.append(comprar); actualizarPrecio();
  });
  const abrir = nodo('button', 'monarca-cart-toggle');
  abrir.type = 'button';
  abrir.innerHTML = '🛒 Carrito (<span id="monarca-cart-count">0</span>)';
  abrir.setAttribute('aria-label', 'Abrir carrito');
  const cabecera = nodo('div', 'monarca-cart-header');
  const cerrar = nodo('button', 'monarca-cart-close', '✕');
  cerrar.type = 'button'; cerrar.setAttribute('aria-label', 'Cerrar carrito');
  cabecera.append(nodo('h2', '', 'Tu carrito'), cerrar);
  const lista = nodo('div'); lista.id = 'monarca-cart-list';
  const resumen = nodo('div', 'monarca-total');
  const total = nodo('strong', '', 'Bs 0,00'); total.id = 'monarca-cart-total';
  resumen.append(nodo('span', '', 'Total'), total);
  const finalizar = nodo('button', 'monarca-checkout', 'Consultar pedido por WhatsApp');
  finalizar.id = 'monarca-checkout'; finalizar.type = 'button';
  const nota = nodo('p', 'monarca-cart-note', 'El pedido se consulta por WhatsApp, sin cobro online. Disponibilidad y entrega sujetas a confirmación. Venta exclusiva a mayores de edad conforme a la normativa aplicable.');
  panel.append(cabecera, lista, resumen, finalizar, nota);
  document.body.append(abrir, panel);
  abrir.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  cerrar.addEventListener('click', () => { panel.hidden = true; });
  finalizar.addEventListener('click', confirmarPedido);
  mostrarCarrito();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
