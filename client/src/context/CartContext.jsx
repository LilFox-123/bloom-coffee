import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // items: { [menuItemId]: { menuItem, quantity } }
  const [items, setItems] = useState({});
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tienmat');

  const add = useCallback((menuItem) => {
    setItems((prev) => {
      const cur = prev[menuItem._id];
      return {
        ...prev,
        [menuItem._id]: { menuItem, quantity: (cur?.quantity || 0) + 1 },
      };
    });
  }, []);

  const inc = useCallback((id) => {
    setItems((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], quantity: prev[id].quantity + 1 } };
    });
  }, []);

  const dec = useCallback((id) => {
    setItems((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      if (cur.quantity <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...cur, quantity: cur.quantity - 1 } };
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
    setNotes('');
  }, []);

  const list = useMemo(() => Object.values(items), [items]);
  const count = useMemo(() => list.reduce((s, i) => s + i.quantity, 0), [list]);
  const subtotal = useMemo(
    () => list.reduce((s, i) => s + i.menuItem.price * i.quantity, 0),
    [list]
  );
  const vat = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => subtotal + vat, [subtotal, vat]);

  const qtyOf = useCallback((id) => items[id]?.quantity || 0, [items]);

  const value = {
    items,
    list,
    count,
    subtotal,
    vat,
    total,
    qtyOf,
    add,
    inc,
    dec,
    remove,
    clear,
    notes,
    setNotes,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
