import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CartContext = createContext(null);

function cleanCustomizations(customizations = {}) {
  return Object.fromEntries(
    Object.entries(customizations).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function customizationSignature(customizations = {}) {
  const clean = cleanCustomizations(customizations);
  return Object.keys(clean)
    .sort()
    .map((key) => `${key}:${clean[key]}`)
    .join('|');
}

export function CartProvider({ children }) {
  // items: { [menuItemId]: { menuItem, quantity } }
  const [items, setItems] = useState({});
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [memberCustomer, setMemberCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('tienmat');
  const [tableNumber, setTableNumber] = useState('');

  const resolveLineId = useCallback((prev, id) => {
    if (prev[id]) return id;
    return Object.keys(prev).find((key) => String(prev[key].menuItem._id) === String(id));
  }, []);

  const add = useCallback((menuItem, customizations = {}) => {
    const cleanOptions = cleanCustomizations(customizations);
    const signature = customizationSignature(cleanOptions);
    const lineId = signature ? `${menuItem._id}:${signature}` : String(menuItem._id);
    setItems((prev) => {
      const cur = prev[lineId];
      return {
        ...prev,
        [lineId]: {
          lineId,
          menuItem,
          customizations: cleanOptions,
          quantity: (cur?.quantity || 0) + 1,
        },
      };
    });
  }, []);

  const inc = useCallback((id) => {
    setItems((prev) => {
      const lineId = resolveLineId(prev, id);
      if (!lineId) return prev;
      return { ...prev, [lineId]: { ...prev[lineId], quantity: prev[lineId].quantity + 1 } };
    });
  }, [resolveLineId]);

  const dec = useCallback((id) => {
    setItems((prev) => {
      const lineId = resolveLineId(prev, id);
      const cur = lineId ? prev[lineId] : null;
      if (!cur) return prev;
      if (cur.quantity <= 1) {
        const next = { ...prev };
        delete next[lineId];
        return next;
      }
      return { ...prev, [lineId]: { ...cur, quantity: cur.quantity - 1 } };
    });
  }, [resolveLineId]);

  const remove = useCallback((id) => {
    setItems((prev) => {
      const lineId = resolveLineId(prev, id);
      if (!lineId) return prev;
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }, [resolveLineId]);

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
  const vat = useMemo(() => 0, []);
  const total = useMemo(() => subtotal, [subtotal]);

  const qtyOf = useCallback(
    (id) =>
      Object.values(items).reduce(
        (sum, row) => sum + (String(row.menuItem._id) === String(id) ? row.quantity : 0),
        0
      ),
    [items]
  );

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
    memberCustomer,
    setMemberCustomer,
    paymentMethod,
    setPaymentMethod,
    tableNumber,
    setTableNumber,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
