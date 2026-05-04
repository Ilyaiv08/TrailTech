import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../api';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutForm, setCheckoutForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    delivery_method: 'pickup',
    delivery_address: '',
    payment_method: 'card',
    comment: '',
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(id, newQuantity);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Пожалуйста, войдите для оформления заказа');
      navigate('/login');
      return;
    }
    
    if (cart.items.length === 0) {
      alert('Корзина пуста');
      return;
    }
    
    setIsOrdering(true);
    try {
      const orderData = {
        ...checkoutForm,
        delivery_address: checkoutForm.delivery_method === 'delivery' 
          ? checkoutForm.delivery_address 
          : null,
      };
      
      await ordersAPI.create(orderData);
      clearCart();
      navigate('/orders');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при оформлении заказа');
    } finally {
      setIsOrdering(false);
    }
  };

  const deliveryCost = checkoutForm.delivery_method === 'delivery' ? 500 : 0;
  const totalWithDelivery = cart.total + deliveryCost;

  if (cart.items.length === 0) {
    return (
      <Container className="cart-empty">
        <div className="empty-icon">
          <i className="bi bi-cart-x"></i>
        </div>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары, чтобы оформить заказ</p>
        <Button as={Link} to="/catalog" className="btn-catalog">
          <i className="bi bi-shop"></i> Перейти в каталог
        </Button>
      </Container>
    );
  }

  return (
    <div className="cart-page">
      <Container>
        <div className="cart-header">
          <h1><i className="bi bi-cart3"></i> Корзина</h1>
          <p className="cart-subtitle">{cart.items.length} товаров</p>
        </div>
        
        <Row className="g-4">
          <Col lg={7}>
            <div className="cart-section-title">
              <h3><i className="bi bi-box-seam"></i> Товары в корзине</h3>
            </div>
            
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image-wrapper">
                    <img 
                      src={item.image?.startsWith('/uploads') 
                        ? `http://localhost:5000${item.image}` 
                        : item.image || '/img/placeholder.jpg'} 
                      alt={item.name}
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=TrailTech';
                      }}
                    />
                  </div>
                  
                  <div className="cart-item-details">
                    <Link to={`/product/${item.product_id}`} className="cart-item-title">
                      {item.name}
                    </Link>
                    <div className="cart-item-meta">
                      <span className="cart-item-category">{item.category_name || 'Товар'}</span>
                    </div>
                    <div className="cart-item-price">
                      {item.price.toLocaleString()} ₽
                    </div>
                  </div>
                  
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn" 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button 
                        className="quantity-btn" 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                    <button 
                      className="btn-remove"
                      onClick={() => removeFromCart(item.id)}
                      title="Удалить"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                  
                  <div className="cart-item-total">
                    <span className="label">Итого:</span>
                    <span className="value">{(item.price * item.quantity).toLocaleString()} ₽</span>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline-danger" 
              className="btn-clear-cart"
              onClick={clearCart}
            >
              <i className="bi bi-trash"></i> Очистить корзину
            </Button>
          </Col>
          
          <Col lg={5}>
            <div className="checkout-sticky">
              <Card className="checkout-card">
                <Card.Header>
                  <h3><i className="bi bi-receipt"></i> Ваш заказ</h3>
                </Card.Header>
                <Card.Body>
                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Товары ({cart.items.reduce((sum, i) => sum + i.quantity, 0)} шт.):</span>
                      <span>{cart.total.toLocaleString()} ₽</span>
                    </div>
                    
                    <div className="summary-row">
                      <span>Доставка:</span>
                      <span className={deliveryCost === 0 ? 'free' : ''}>
                        {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost} ₽`}
                      </span>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-row summary-total">
                      <span>Итого к оплате:</span>
                      <span>{totalWithDelivery.toLocaleString()} ₽</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="btn-proceed-checkout"
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? 'Скрыть форму' : `Оформить за ${totalWithDelivery.toLocaleString()} ₽`}
                    <i className={`bi bi-chevron-${showForm ? 'up' : 'down'}`}></i>
                  </Button>
                  
                  {showForm && (
                    <Form onSubmit={handleCheckout} className="checkout-form">
                      <div className="form-section">
                        <h4><i className="bi bi-person"></i> Данные получателя</h4>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>ФИО *</Form.Label>
                          <Form.Control
                            type="text"
                            required
                            value={checkoutForm.name}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                            placeholder="Иванов Иван Иванович"
                          />
                        </Form.Group>
                        
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Email *</Form.Label>
                              <Form.Control
                                type="email"
                                required
                                value={checkoutForm.email}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                                placeholder="example@mail.ru"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Телефон *</Form.Label>
                              <Form.Control
                                type="tel"
                                required
                                value={checkoutForm.phone}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                                placeholder="+7 (999) 123-45-67"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                      
                      <div className="form-section">
                        <h4><i className="bi bi-truck"></i> Доставка</h4>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Способ доставки</Form.Label>
                          <div className="delivery-options">
                            <label className={`delivery-option ${checkoutForm.delivery_method === 'pickup' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="delivery_method"
                                value="pickup"
                                checked={checkoutForm.delivery_method === 'pickup'}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_method: e.target.value })}
                              />
                              <div className="option-content">
                                <i className="bi bi-shop"></i>
                                <span>Самовывоз</span>
                                <small>Бесплатно</small>
                              </div>
                            </label>
                            <label className={`delivery-option ${checkoutForm.delivery_method === 'delivery' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="delivery_method"
                                value="delivery"
                                checked={checkoutForm.delivery_method === 'delivery'}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_method: e.target.value })}
                              />
                              <div className="option-content">
                                <i className="bi bi-bicycle"></i>
                                <span>Курьером</span>
                                <small>500 ₽</small>
                              </div>
                            </label>
                          </div>
                        </Form.Group>
                        
                        {checkoutForm.delivery_method === 'delivery' && (
                          <Form.Group className="mb-3">
                            <Form.Label>Адрес доставки *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              required
                              value={checkoutForm.delivery_address}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_address: e.target.value })}
                              placeholder="Город, улица, дом, квартира, подъезд, этаж"
                            />
                          </Form.Group>
                        )}
                      </div>
                      
                      <div className="form-section">
                        <h4><i className="bi bi-credit-card"></i> Оплата</h4>
                        
                        <div className="payment-options">
                          <label className={`payment-option ${checkoutForm.payment_method === 'card' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="payment_method"
                              value="card"
                              checked={checkoutForm.payment_method === 'card'}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })}
                            />
                            <i className="bi bi-credit-card-2-front"></i>
                            <span>Картой онлайн</span>
                          </label>
                          <label className={`payment-option ${checkoutForm.payment_method === 'cash' ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="payment_method"
                              value="cash"
                              checked={checkoutForm.payment_method === 'cash'}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })}
                            />
                            <i className="bi bi-cash"></i>
                            <span>При получении</span>
                          </label>
                        </div>
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Комментарий к заказу</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={checkoutForm.comment}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, comment: e.target.value })}
                          placeholder="Пожелания к заказу (необязательно)"
                        />
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        className="btn-confirm-order"
                        disabled={isOrdering}
                      >
                        {isOrdering ? (
                          <><span className="spinner-sm"></span> Оформляем...</>
                        ) : (
                          <><i className="bi bi-check-circle"></i> Подтвердить заказ</>
                        )}
                      </Button>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;
