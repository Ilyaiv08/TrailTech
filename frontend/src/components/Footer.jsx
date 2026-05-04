import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col md={6} className="mb-4 mb-md-0">
            <h4 className="footer-brand">
              <i className="bi bi-lightning-charge-fill"></i> TrailTech
            </h4>
            <p className="footer-description">
              Магазин техники для активного образа жизни. 
              Лучшее снаряжение для ваших приключений.
            </p>
            <div className="social-links">
              <a href="https://t.me/TrailTech_Bot" target="_blank" rel="noopener noreferrer" title="Наш Telegram-бот">
                <i className="bi bi-telegram"></i>
              </a>
            </div>
          </Col>
          
          <Col md={3}>
            <h5 className="footer-title">Навигация</h5>
            <div className="footer-links">
              <p><Link to="/catalog">Каталог товаров</Link></p>
              <p><Link to="/about">О нас</Link></p>
              <p><Link to="/contacts">Контакты</Link></p>
            </div>
          </Col>
          
          <Col md={3}>
            <h5 className="footer-title">Контакты</h5>
            <div className="footer-contacts">
              <p><i className="bi bi-geo-alt"></i> Москва, ул. Примерная, 10</p>
              <p><i className="bi bi-telephone"></i> +7 (999) 123-45-67</p>
              <p><i className="bi bi-envelope"></i> info@trailtech.ru</p>
            </div>
          </Col>
        </Row>
        
        <hr className="footer-divider" />
        
        <Row>
          <Col className="text-center">
            <p className="footer-copyright">
              © 2024 TrailTech. Все права защищены.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
