import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { favoritesAPI } from '../api';
import './ProductCard.css';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Отладка - выводим данные товара
  console.log('ProductCard:', product.name, 'is_hit:', product.is_hit, 'is_new:', product.is_new);

  // Получаем первую картинку из images массива или используем image
  const getImageUrl = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0].startsWith('/uploads') 
        ? `http://localhost:5000${product.images[0]}` 
        : product.images[0];
    }
    return product.image?.startsWith('/uploads') 
      ? `http://localhost:5000${product.image}` 
      : product.image || '/img/placeholder.jpg';
  };

  const handleAddToCart = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите для добавления в корзину');
      return;
    }
    
    const success = await addToCart(product.id, 1);
    if (success) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const handleToggleFavorite = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите для добавления в избранное');
      return;
    }
    
    try {
      if (isFavorite) {
        await favoritesAPI.remove(product.id);
      } else {
        await favoritesAPI.add(product.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : 0;

  // Преобразуем is_new и is_hit в булево значение
  const isNew = product.is_new === 1 || product.is_new === true;
  const isHit = product.is_hit === 1 || product.is_hit === true;

  return (
    <div className={`product-card view-${viewMode}`}>
      {isNew && <span className="badge-new">Новинка</span>}
      {isHit && <span className="badge-hit">Хит</span>}
      
      <Link to={`/product/${product.id}`} className="product-image-link">
        <div className="product-image-wrapper">
          <img 
            src={getImageUrl()} 
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=TrailTech';
            }}
          />
          {discount > 0 && (
            <span className="discount-badge">-{discount}%</span>
          )}
        </div>
      </Link>
      
      <div className="product-body">
        <Link to={`/product/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>
        
        <p className="product-category">{product.category_name}</p>
        
        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <i 
                key={i} 
                className={`bi bi-star${i < Math.floor(product.rating) ? '-fill' : ''}`}
              />
            ))}
          </div>
          <span className="rating-count">({product.reviews_count})</span>
        </div>
        
        <p className="product-description">
          {product.description?.substring(0, 80)}...
        </p>
        
        <div className="product-price-block">
          <div className="product-price">
            <span className="price-current">{product.price.toLocaleString()} ₽</span>
            {product.old_price && (
              <span className="price-old">{product.old_price.toLocaleString()} ₽</span>
            )}
          </div>
          
          <div className="product-actions">
            <button className="btn-add-cart" onClick={handleAddToCart} title="В корзину">
              <i className="bi bi-cart-plus"></i>
            </button>
            <button 
              className={`btn-favorite ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              title="В избранное"
            >
              <i className="bi bi-heart"></i>
            </button>
            <Link to={`/product/${product.id}`} className="btn-quick-view" title="Подробнее">
              <i className="bi bi-eye"></i>
            </Link>
          </div>
        </div>
      </div>
      
      {showNotification && (
        <div className="toast-notification">
          <i className="bi bi-check-circle-fill"></i> Добавлено в корзину
        </div>
      )}
    </div>
  );
};

export default ProductCard;
