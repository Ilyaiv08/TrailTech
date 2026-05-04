import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import './Contacts.css';

const Contacts = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contacts-page">
      <Container>
        <h1 className="page-title">Контакты</h1>
        
        <Row className="g-4">
          <Col md={6}>
            <Card className="contact-info-card">
              <Card.Header>
                <h3 className="mb-0">Контактная информация</h3>
              </Card.Header>
              <Card.Body>
                <div className="contact-item">
                  <i className="bi bi-geo-alt"></i>
                  <div>
                    <h5>Адрес</h5>
                    <p>Москва, ул. Примерная, 10, офис 5</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <i className="bi bi-telephone"></i>
                  <div>
                    <h5>Телефон</h5>
                    <p>+7 (999) 123-45-67</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <i className="bi bi-envelope"></i>
                  <div>
                    <h5>Email</h5>
                    <p>info@trailtech.ru</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <i className="bi bi-clock"></i>
                  <div>
                    <h5>Режим работы</h5>
                    <p>Пн-Вс: 9:00 - 21:00</p>
                  </div>
                </div>
                
                <div className="contact-social">
                  <h5>Мы в социальных сетях</h5>
                  <div className="social-links">
                    <a href="https://t.me/TrailTech_Bot" target="_blank" rel="noopener noreferrer" className="social-telegram" title="Наш Telegram-бот">
                      <i className="bi bi-telegram"></i>
                    </a>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="map-card mt-4">
              <Card.Body className="p-0">
                <div className="map-placeholder">
                  <i className="bi bi-map"></i>
                  <p>Карта проезда</p>
                  <span>Москва, ул. Примерная, 10</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="contact-form-card">
              <Card.Header>
                <h3 className="mb-0">Напишите нам</h3>
              </Card.Header>
              <Card.Body>
                {sent ? (
                  <div className="success-message">
                    <i className="bi bi-check-circle"></i>
                    <h4>Сообщение отправлено!</h4>
                    <p>Мы свяжемся с вами в ближайшее время</p>
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ваше имя</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Иван Иванов"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="example@mail.ru"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Телефон</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Сообщение</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder="Ваш вопрос или предложение"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </Form.Group>
                    
                    <Button type="submit" className="btn-send-message">
                      <i className="bi bi-send"></i> Отправить сообщение
                    </Button>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contacts;
