import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'В обработке', class: 'pending' },
      processing: { label: 'Собирается', class: 'processing' },
      shipped: { label: 'Отправлен', class: 'shipped' },
      delivered: { label: 'Доставлен', class: 'delivered' },
      cancelled: { label: 'Отменен', class: 'cancelled' },
    };
    return statusMap[status] || { label: status, class: status };
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <Container>
        <div className="orders-header">
          <h1><i className="bi bi-bag"></i> Мои заказы</h1>
          <p className="orders-subtitle">История ваших покупок</p>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">
              <i className="bi bi-bag-x"></i>
            </div>
            <h2>У вас пока нет заказов</h2>
            <p>Оформите первый заказ в нашем магазине</p>
            <Button as={Link} to="/catalog" className="btn-catalog">
              <i className="bi bi-shop"></i> Перейти в каталог
            </Button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <Card 
                  key={order.id} 
                  className={`order-card ${selectedOrder === order.id ? 'expanded' : ''}`}
                >
                  <Card.Body>
                    <div className="order-header">
                      <div className="order-info">
                        <span className="order-number">Заказ №{order.id}</span>
                        <span className="order-date">
                          {new Date(order.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <Badge className={`status-badge status-${statusInfo.class}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="order-items-preview">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="order-item-preview">
                          <img 
                            src={item.image?.startsWith('/uploads') 
                              ? `http://localhost:5000${item.image}` 
                              : item.image || '/img/placeholder.jpg'} 
                            alt={item.name}
                            className="item-image"
                          />
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">{item.quantity} шт. × {item.price.toLocaleString()} ₽</span>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="more-items">
                          + ещё {order.items.length - 3} {order.items.length - 3 === 1 ? 'товар' : 'товара'}
                        </div>
                      )}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <span>Итого:</span>
                        <strong>{order.total_amount.toLocaleString()} ₽</strong>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        className="btn-details"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      >
                        {selectedOrder === order.id ? 'Скрыть детали' : 'Подробнее'}
                        <i className={`bi bi-chevron-${selectedOrder === order.id ? 'up' : 'down'}`}></i>
                      </Button>
                    </div>

                    {selectedOrder === order.id && (
                      <div className="order-details" animation="slideDown">
                        <div className="details-section">
                          <h4>Товары в заказе</h4>
                          <div className="full-items-list">
                            {order.items.map((item, index) => (
                              <div key={index} className="full-item">
                                <img 
                                  src={item.image?.startsWith('/uploads') 
                                    ? `http://localhost:5000${item.image}` 
                                    : item.image || '/img/placeholder.jpg'} 
                                  alt={item.name}
                                  className="full-item-image"
                                />
                                <div className="full-item-info">
                                  <span className="full-item-name">{item.name}</span>
                                  <span className="full-item-quantity">{item.quantity} шт.</span>
                                </div>
                                <span className="full-item-price">{(item.price * item.quantity).toLocaleString()} ₽</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="details-section">
                          <h4><i className="bi bi-truck"></i> Доставка</h4>
                          <div className="delivery-info">
                            <p><strong>Способ:</strong> {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Курьером'}</p>
                            {order.delivery_address && (
                              <p><strong>Адрес:</strong> {order.delivery_address}</p>
                            )}
                          </div>
                        </div>

                        <div className="details-section">
                          <h4><i className="bi bi-person"></i> Получатель</h4>
                          <div className="recipient-info">
                            <p><strong>ФИО:</strong> {order.name}</p>
                            <p><strong>Телефон:</strong> {order.phone}</p>
                            <p><strong>Email:</strong> {order.email}</p>
                          </div>
                        </div>

                        {order.comment && (
                          <div className="details-section">
                            <h4><i className="bi bi-chat-left-text"></i> Комментарий</h4>
                            <p className="comment-text">{order.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Orders;
