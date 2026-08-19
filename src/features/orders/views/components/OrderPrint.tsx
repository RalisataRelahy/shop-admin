import React, { useMemo } from 'react';
import shopGoodLogo from '../../../../assets/shop_good.png';
import './OrderPrint.css';

export interface PrintOrderItem { id: string; name: string; quantity: number; unitPrice: number; variante?: string | null; }
export interface PrintOrder {
  id: string; clientName: string; clientPhone: string; deliveryAddress: string; deliveryMode: string;
  deliveryModeKey?: string; paymentMethod: string; totalPrice: number; pickupTime: string; createdAt: string;
  items: PrintOrderItem[]; notes?: string | null;
}
interface OrderPrintProps { order: PrintOrder; type: 'commande' | 'livraison'; onClose?: () => void; }

const formatPrice = (value: number): string => `${(Number.isFinite(value) ? value : 0).toLocaleString('fr-FR')} Ar`;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

const OrderPrint: React.FC<OrderPrintProps> = ({ order, type, onClose }) => {
  const isKitchenTicket = type === 'livraison';
  const isDelivery = order.deliveryModeKey === 'delivery' || order.deliveryMode === 'delivery';
  const items = order.items ?? [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice), 0), [items]);
  const deliveryFee = Math.max((Number(order.totalPrice) || 0) - subtotal, 0);
  // La remise ne s'applique qu'aux articles : les frais de livraison sont exclus.
  const discount = Math.ceil(subtotal * 0.05);
  const totalAfterDiscount = Math.max(0, subtotal - discount) + deliveryFee;

  return (
    <section className="print-page" aria-label={isKitchenTicket ? 'Ticket de cuisine' : 'Bon de commande'}>
      <div className="print-toolbar no-print">
        <button type="button" className="print-close" onClick={onClose}>Fermer</button>
        <button type="button" className="print-trigger" onClick={() => window.print()}>Imprimer</button>
      </div>
      <article className={`print-document ${isKitchenTicket ? 'print-document--kitchen' : ''}`}>
        <header className="print-header">
          <img className="print-logo" src={shopGoodLogo} alt="Shop Good" />
          {!isKitchenTicket && <div className="print-restaurant"><div>Antananarivo, Madagascar</div><div>034 99 999 99</div></div>}
        </header>
        <div className="print-separator" />
        <section className="print-title"><h1>{isKitchenTicket ? 'TICKET DE CUISINE' : 'BON DE COMMANDE'}</h1><div><strong>N° :</strong> {order.id.slice(0, 8).toUpperCase()}</div><div><strong>Date :</strong> {formatDate(order.createdAt)}</div></section>
        <div className="print-separator" />
        <section className="print-section">
          <h2>{isKitchenTicket ? 'COMMANDE' : 'CLIENT'}</h2>
          <div className="print-info"><strong>Nom :</strong><span>{order.clientName || 'Client non renseigné'}</span></div>
          {!isKitchenTicket && order.clientPhone && <div className="print-info"><strong>Téléphone :</strong><span>{order.clientPhone}</span></div>}
          {isDelivery && order.deliveryAddress && <div className="print-info print-address"><strong>Adresse :</strong><span>{order.deliveryAddress}</span></div>}
          {order.pickupTime && <div className="print-info"><strong>{isDelivery ? 'Livraison prévue :' : 'Retrait prévu :'}</strong><span>{order.pickupTime}</span></div>}
        </section>
        <div className="print-separator" />
        <section className="print-section">
          <h2>ARTICLES <span className="print-items-count">({items.length})</span></h2>
          <div className={`print-products-header ${isKitchenTicket ? 'print-products-header--kitchen' : ''}`}><span>Article</span><span>Qté</span>{!isKitchenTicket && <span>Total</span>}</div>
          {items.length ? items.map((item) => {
            const lineTotal = Math.max(0, item.quantity) * Math.max(0, item.unitPrice);
            return <div key={item.id} className={`print-product ${isKitchenTicket ? 'print-product--kitchen' : ''}`}><div className="print-product-name"><strong>{item.name}</strong>{item.variante && <small>Option : {item.variante}</small>}</div><span className="print-quantity">×{item.quantity}</span>{!isKitchenTicket && <span className="print-line-total">{formatPrice(lineTotal)}</span>}</div>;
          }) : <p className="print-empty-items">Aucun article enregistré.</p>}
        </section>
        {!isKitchenTicket && <><div className="print-separator" /><section className="print-totals"><div className="print-total-line"><span>Sous-total</span><strong>{formatPrice(subtotal)}</strong></div><div className="print-total-line print-discount"><span>Remise 5 %</span><strong>− {formatPrice(discount)}</strong></div>{isDelivery && <div className="print-total-line"><span>Livraison</span><strong>{formatPrice(deliveryFee)}</strong></div>}<div className="print-separator" /><div className="print-grand-total"><span>TOTAL</span><strong>{formatPrice(totalAfterDiscount)}</strong></div>{order.paymentMethod && <div className="print-payment"><strong>Paiement :</strong> {order.paymentMethod}</div>}</section></>}
        {order.notes?.trim() && <><div className="print-separator" /><section className="print-notes"><strong>Note :</strong><p>{order.notes}</p></section></>}
        {!isKitchenTicket && <footer className="print-footer"><div className="print-separator" /><strong>Merci pour votre commande !</strong><strong>SHOP GOOD</strong></footer>}
      </article>
    </section>
  );
};
export default OrderPrint;
