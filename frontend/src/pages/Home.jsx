import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [hitProducts, setHitProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, newRes, hitRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ new: true }),
          productsAPI.getAll({ hit: true }),
        ]);
        
        setCategories(categoriesRes.data);
        setNewProducts(newRes.data.slice(0, 4));
        setHitProducts(hitRes.data.slice(0, 4));
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <Container className="hero-content">
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="hero-text">
                <span className="hero-badge">
                  <i className="bi bi-lightning-charge-fill"></i> TrailTech
                </span>
                <h1 className="hero-title">
                  Техника для ваших <span className="highlight">приключений</span>
                </h1>
                <p className="hero-subtitle">
                  Лучшее снаряжение для активного образа жизни, путешествий и выживания в дикой природе
                </p>
                <div className="hero-buttons">
                  <Button as={Link} to="/catalog" className="btn-hero-primary">
                    <i className="bi bi-shop"></i> В каталог
                  </Button>
                  <Button as={Link} to="/about" className="btn-hero-secondary">
                    <i className="bi bi-info-circle"></i> О нас
                  </Button>
                </div>
                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="stat-number">5000+</span>
                    <span className="stat-label">Клиентов</span>
                  </div>
                  <div className="hero-stat">
                    <span className="stat-number">200+</span>
                    <span className="stat-label">Товаров</span>
                  </div>
                  <div className="hero-stat">
                    <span className="stat-number">5 лет</span>
                    <span className="stat-label">На рынке</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-image-wrapper">
                <div className="hero-cards">
                  <div className="hero-card card-1">
                    <div className="hero-card-icon">
                      <i className="bi bi-lightning-charge"></i>
                    </div>
                    <span>Power Bank</span>
                  </div>
                  <div className="hero-card card-2">
                    <div className="hero-card-icon">
                      <i className="bi bi-watch"></i>
                    </div>
                    <span>Smart Watch</span>
                  </div>
                  <div className="hero-card card-3">
                    <div className="hero-card-icon">
                      <i className="bi bi-brightness-high"></i>
                    </div>
                    <span>Solar Charger</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <Container>
          <div className="section-header">
            <span className="section-tag">Выбор по категориям</span>
            <h2 className="section-title">Категории товаров</h2>
            <p className="section-subtitle">Найдите всё необходимое для вашего приключения</p>
          </div>
          <Row className="g-3">
            {categories.map((category) => (
              <Col key={category.id} xs={6} sm={4} md={3} lg={2}>
                <Link to={`/catalog?category=${category.id}`} className="category-link">
                  <div className="category-card">
                    <div className="category-icon-wrapper">
                      <i className="bi bi-box-seam"></i>
                    </div>
                    <h3 className="category-name">{category.name}</h3>
                    <span className="category-count">{category.products_count} товаров</span>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="products-section section-new">
          <Container>
            <div className="section-header">
              <span className="section-tag">Свежие поступления</span>
              <h2 className="section-title">Новинки</h2>
              <Button as={Link} to="/catalog?new=true" variant="outline" className="btn-view-all">
                Смотреть все <i className="bi bi-arrow-right"></i>
              </Button>
            </div>
            <Row className="g-4">
              {newProducts.map((product) => (
                <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Hit Products */}
      {hitProducts.length > 0 && (
        <section className="products-section section-hits">
          <Container>
            <div className="section-header">
              <span className="section-tag">Популярное</span>
              <h2 className="section-title">Хиты продаж</h2>
              <Button as={Link} to="/catalog?hit=true" variant="outline" className="btn-view-all">
                Смотреть все <i className="bi bi-arrow-right"></i>
              </Button>
            </div>
            <Row className="g-4">
              {hitProducts.map((product) => (
                <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Features */}
      <section className="features-section">
        <Container>
          <div className="section-header">
            <span className="section-tag">Почему мы</span>
            <h2 className="section-title">Наши преимущества</h2>
          </div>
          <Row className="g-4">
            <Col md={3}>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="bi bi-truck"></i>
                </div>
                <h3>Быстрая доставка</h3>
                <p>По всей России от 2 дней. Бесплатно при заказе от 10 000 ₽</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3>Гарантия качества</h3>
                <p>Только сертифицированные товары. Гарантия до 2 лет</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="bi bi-percent"></i>
                </div>
                <h3>Лучшие цены</h3>
                <p>Гарантия низкой цены. Скидки постоянным клиентам</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <i className="bi bi-headset"></i>
                </div>
                <h3>Поддержка 24/7</h3>
                <p>Всегда на связи. Помощь в выборе и консультации</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <div className="cta-content">
            <h2>Готовы к приключениям?</h2>
            <p>Присоединяйтесь к тысячам довольных клиентов по всей России</p>
            <div className="cta-buttons">
              <Button as={Link} to="/register" className="btn-cta-primary">
                <i className="bi bi-person-plus"></i> Зарегистрироваться
              </Button>
              <Button as={Link} to="/catalog" className="btn-cta-secondary">
                <i className="bi bi-cart"></i> Сделать заказ
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Home;
