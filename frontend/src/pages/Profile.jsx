import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(formData);
      updateUser(formData);
      setEditMode(false);
      setMessage({ text: 'Профиль успешно обновлен', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Ошибка обновления профиля', type: 'error' });
    }
  };

  return (
    <div className="profile-page">
      <Container>
        <div className="profile-header">
          <h1><i className="bi bi-person-circle"></i> Личный кабинет</h1>
          <p className="profile-subtitle">Управление личной информацией</p>
        </div>

        {message.text && (
          <div className={`alert-message ${message.type}`}>
            <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'x-circle'}`}></i>
            {message.text}
          </div>
        )}
        
        <Row className="g-4">
          <Col lg={4}>
            <Card className="profile-card">
              <Card.Body>
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <span className={`profile-badge ${user?.role === 'admin' ? 'admin' : 'user'}`}>
                    {user?.role === 'admin' ? 'Администратор' : 'Покупатель'}
                  </span>
                </div>
                <h3 className="profile-name">{user?.name}</h3>
                <p className="profile-email">{user?.email}</p>
                <p className="profile-member-since">
                  <i className="bi bi-calendar-check"></i>
                  С {new Date(user?.created_at).toLocaleDateString('ru-RU')}
                </p>
              </Card.Body>
            </Card>
            
            <Card className="profile-menu-card">
              <Card.Header>
                <h4><i className="bi bi-menu-button"></i> Меню</h4>
              </Card.Header>
              <Card.Body>
                <div className="profile-menu">
                  <Link to="/profile" className="menu-item active">
                    <i className="bi bi-person"></i>
                    <span>Профиль</span>
                  </Link>
                  <Link to="/orders" className="menu-item">
                    <i className="bi bi-bag"></i>
                    <span>Мои заказы</span>
                    <span className="menu-badge">История</span>
                  </Link>
                  <Link to="/favorites" className="menu-item">
                    <i className="bi bi-heart"></i>
                    <span>Избранное</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="menu-item admin-link">
                      <i className="bi bi-gear"></i>
                      <span>Админ-панель</span>
                    </Link>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="profile-stats-card">
              <Card.Body>
                <h4><i className="bi bi-graph-up"></i> Статистика</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Заказов</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Избранное</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Отзывов</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={8}>
            <Card className="profile-info-card">
              <Card.Header>
                <div className="card-header-content">
                  <h3><i className="bi bi-file-person"></i> Личная информация</h3>
                  <Button 
                    variant={editMode ? "outline-secondary" : "outline-primary"}
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="btn-toggle-edit"
                  >
                    <i className={`bi bi-${editMode ? 'x' : 'pencil'}`}></i>
                    {editMode ? 'Отмена' : 'Редактировать'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleUpdateProfile}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Фамилия Имя</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!editMode}
                          className={editMode ? 'edit-mode' : ''}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={user?.email}
                          disabled
                          className="disabled-field"
                        />
                        <Form.Text className="text-muted">
                          <i className="bi bi-info-circle"></i> Email нельзя изменить
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Телефон</Form.Label>
                        <Form.Control
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!editMode}
                          placeholder="+7 (___) ___-__-__"
                          className={editMode ? 'edit-mode' : ''}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Адрес доставки</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          disabled={!editMode}
                          placeholder="Город, улица, дом"
                          className={editMode ? 'edit-mode' : ''}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {editMode && (
                    <div className="form-actions">
                      <Button type="submit" className="btn-save-profile">
                        <i className="bi bi-check-circle"></i> Сохранить изменения
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: user?.name || '',
                            phone: user?.phone || '',
                            address: user?.address || '',
                          });
                        }}
                      >
                        <i className="bi bi-x-circle"></i> Отмена
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
            
            {/* Quick Actions */}
            <Card className="quick-actions-card">
              <Card.Header>
                <h3><i className="bi bi-lightning"></i> Быстрые действия</h3>
              </Card.Header>
              <Card.Body>
                <div className="quick-actions-grid">
                  <Link to="/catalog" className="quick-action-item">
                    <i className="bi bi-shop"></i>
                    <span>В каталог</span>
                  </Link>
                  <Link to="/orders" className="quick-action-item">
                    <i className="bi bi-bag"></i>
                    <span>Заказы</span>
                  </Link>
                  <Link to="/favorites" className="quick-action-item">
                    <i className="bi bi-heart"></i>
                    <span>Избранное</span>
                  </Link>
                  <Link to="/cart" className="quick-action-item">
                    <i className="bi bi-cart3"></i>
                    <span>Корзина</span>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;
