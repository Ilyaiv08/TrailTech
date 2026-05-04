import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { productsAPI, reviewsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          productsAPI.getById(id),
          reviewsAPI.getByProduct(id),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите для добавления в корзину');
      navigate('/login');
      return;
    }
    
    const success = await addToCart(product.id, quantity);
    if (success) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите для оставления отзыва');
      navigate('/login');
      return;
    }
    
    try {
      await reviewsAPI.add({
        product_id: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      
      setReviewForm({ rating: 5, comment: '' });
      const { data } = await reviewsAPI.getByProduct(id);
      setReviews(data);
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при отправке отзыва');
    }
  };

  // Получаем все изображения товара
  const getImages = () => {
    if (!product) return [];
    if (product.images && Array.isArray(product.images)) {
      return product.images.map(img => 
        img.startsWith('/uploads') ? `http://localhost:5000${img}` : img
      );
    }
    if (product.image) {
      return [product.image.startsWith('/uploads') ? `http://localhost:5000${product.image}` : product.image];
    }
    return [];
  };

  const images = getImages();

  if (loading) {
    return (
      <div className="loading-page">
        <i className="bi bi-arrow-repeat"></i>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <Container className="error-page">
        <h2>Товар не найден</h2>
        <Button onClick={() => navigate('/catalog')}>Вернуться в каталог</Button>
      </Container>
    );
  }

  const discount = product.old_price 
    ? Math.round((1 - product.price / product.old_price) * 100) 
    : 0;

  return (
    <div className="product-detail-page">
      <Container>
        <div className="product-detail">
          <Row>
            <Col md={6}>
              {/* Главное изображение */}
              <div className="product-detail-image-wrapper">
                <img 
                  src={images[selectedImage] || '/img/placeholder.jpg'} 
                  alt={product.name}
                  className="product-detail-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x600?text=TrailTech';
                  }}
                />
              </div>
              
              {/* Миниатюры */}
              {images.length > 1 && (
                <div className="image-thumbnails">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </Col>
            
            <Col md={6}>
              <div className="product-detail-info">
                {product.is_new && <span className="badge-new">Новинка</span>}
                {product.is_hit && <span className="badge-hit">Хит</span>}
                
                <h1 className="product-detail-title">{product.name}</h1>
                
                <div className="product-detail-rating">
                  {[...Array(5)].map((_, i) => (
                    <i 
                      key={i} 
                      className={`bi bi-star${i < Math.floor(product.rating) ? '-fill' : ''}`}
                    />
                  ))}
                  <span className="rating-count">({product.reviews_count} отзывов)</span>
                </div>
                
                <div className="product-detail-price">
                  <span className="price-current">{product.price.toLocaleString()} ₽</span>
                  {product.old_price && (
                    <>
                      <span className="price-old">{product.old_price.toLocaleString()} ₽</span>
                      {discount > 0 && (
                        <span className="discount-badge">-{discount}%</span>
                      )}
                    </>
                  )}
                </div>
                
                <p className="product-detail-description">
                  {product.description}
                </p>
                
                <div className="product-detail-meta">
                  <div className="meta-item">
                    <i className="bi bi-box"></i>
                    <span>Категория: {product.category_name}</span>
                  </div>
                  <div className="meta-item">
                    <i className="bi bi-check-circle"></i>
                    <span>В наличии: {product.stock} шт.</span>
                  </div>
                </div>
                
                <div className="quantity-section">
                  <label>Количество:</label>
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="product-detail-actions">
                  <Button 
                    className="btn-add-cart-large"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    <i className="bi bi-cart-plus"></i> 
                    {product.stock > 0 ? 'Добавить в корзину' : 'Нет в наличии'}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
        
        {/* Reviews Section */}
        <section className="reviews-section">
          <h2 className="section-title">Отзывы</h2>
          
          <div className="review-form-container">
            <h3>Оставить отзыв</h3>
            <Form onSubmit={handleReviewSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Оценка</Form.Label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`bi bi-star${star <= reviewForm.rating ? '-fill' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    />
                  ))}
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Комментарий</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Расскажите о вашем опыте использования товара"
                />
              </Form.Group>
              
              <Button type="submit" className="btn-submit-review">
                Отправить отзыв
              </Button>
            </Form>
          </div>
          
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">Пока нет отзывов. Будьте первым!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div>
                      <span className="review-author">{review.user_name}</span>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`bi bi-star${i < review.rating ? '-fill' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </Container>
      
      {showNotification && (
        <div className="toast-notification">
          <i className="bi bi-check-circle-fill"></i> Добавлено в корзину
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
