import { Container, Row, Col, Card } from 'react-bootstrap';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Container>
        <h1 className="page-title">О компании TrailTech</h1>

        <div className="about-content">
          <Row className="align-items-center mb-5">
            <Col md={6}>
              <img
                src="/img/istockphoto-823928832-612x612.jpg"
                alt="О нас"
                className="about-image"
              />
            </Col>
            <Col md={6}>
              <h2 className="about-subtitle">Наша миссия</h2>
              <p>
                TrailTech — это магазин для тех, кто не представляет свою жизнь без приключений. 
                Мы предлагаем лучшее снаряжение и технику для активного образа жизни, путешествий 
                и выживания в дикой природе.
              </p>
              <p>
                Наша цель — обеспечить вас надежным оборудованием, которое не подведет в самый 
                ответственный момент. Каждый товар в нашем каталоге проходит тщательный отбор 
                и тестирование.
              </p>
            </Col>
          </Row>
          
          <Row className="mb-5">
            <Col md={4}>
              <Card className="feature-card">
                <Card.Body className="text-center">
                  <i className="bi bi-award feature-icon"></i>
                  <h4>Качество</h4>
                  <p>Только сертифицированные товары от проверенных производителей</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card">
                <Card.Body className="text-center">
                  <i className="bi bi-people feature-icon"></i>
                  <h4>Команда</h4>
                  <p>Мы сами путешественники и знаем, что нужно для приключений</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card">
                <Card.Body className="text-center">
                  <i className="bi bi-globe feature-icon"></i>
                  <h4>Доставка</h4>
                  <p>Отправляем заказы по всей России и странам СНГ</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Card className="stats-card">
                <Card.Body>
                  <Row className="text-center">
                    <Col md={3}>
                      <div className="stat-number">5000+</div>
                      <div className="stat-label">Довольных клиентов</div>
                    </Col>
                    <Col md={3}>
                      <div className="stat-number">200+</div>
                      <div className="stat-label">Товаров в каталоге</div>
                    </Col>
                    <Col md={3}>
                      <div className="stat-number">50+</div>
                      <div className="stat-label">Брендов</div>
                    </Col>
                    <Col md={3}>
                      <div className="stat-number">5 лет</div>
                      <div className="stat-label">На рынке</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default About;
