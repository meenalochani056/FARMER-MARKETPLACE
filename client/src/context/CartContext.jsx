import { createContext, useContext, useMemo, useState } from 'react';
const CartContext = createContext(null);
function readCart() {
  try { return JSON.parse(localStorage.getItem('farmlink-cart') || '[]'); }
  catch (error) { console.error('Unable to restore the saved basket.', error); return []; }
}
export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  function commit(next) { setItems(next); localStorage.setItem('farmlink-cart', JSON.stringify(next)); }
  const value = useMemo(() => ({
    items, count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add(product, quantity = 1) {
      const found = items.find((item) => item._id === product._id);
      const requested = Number(quantity);
      const minimum = Number(product.minimumOrderQuantity) || 1;
      const availableQuantity = Number(product.quantity ?? found?.availableQuantity) || 0;
      if (!Number.isFinite(requested) || requested <= 0) throw new Error('Choose a valid quantity.');
      const nextQuantity = found ? found.quantity + requested : Math.max(minimum, requested);
      if (nextQuantity > availableQuantity || nextQuantity < minimum) throw new Error('That quantity is no longer available.');
      commit(found ? items.map((item) => item._id === product._id ? { ...item, availableQuantity, quantity: nextQuantity } : item) : [...items, { ...product, availableQuantity, quantity: nextQuantity }]);
    },
    setQuantity(id, quantity) {
      const requested = Number(quantity);
      if (!Number.isFinite(requested)) throw new Error('Choose a valid quantity.');
      commit(items.map((item) => item._id === id ? {
        ...item,
        quantity: Math.max(Number(item.minimumOrderQuantity) || 1, Math.min(requested, item.availableQuantity ?? item.quantity))
      } : item));
    },
    remove(id) { commit(items.filter((item) => item._id !== id)); },
    clear() { commit([]); }
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
