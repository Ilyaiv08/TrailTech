import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    try {
      const { data } = await cartAPI.get();
      setCart(data);
    } catch (error) {
      if (error.response?.status === 401) {
        setCart({ items: [], total: 0 });
      }
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      await cartAPI.add(productId, quantity);
      await loadCart();
      return true;
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id, quantity) => {
    setLoading(true);
    try {
      await cartAPI.update(id, quantity);
      await loadCart();
    } catch (error) {
      console.error('Ошибка обновления корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id) => {
    setLoading(true);
    try {
      await cartAPI.remove(id);
      await loadCart();
    } catch (error) {
      console.error('Ошибка удаления из корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await cartAPI.clear();
      setCart({ items: [], total: 0 });
    } catch (error) {
      console.error('Ошибка очистки корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
