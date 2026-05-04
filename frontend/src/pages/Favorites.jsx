import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { favoritesAPI } from '../api';
import ProductCard from '../components/ProductCard';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await favoritesAPI.get();
      setFavorites(data);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (productId) => {
    try {
      await favoritesAPI.remove(productId);
      setFavorites(prevFavorites => prevFavorites.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      alert('Не удалось удалить товар из избранного');
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <i className="bi bi-arrow-repeat"></i>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <Container>
        <h1 className="page-title">
          <i className="bi bi-heart"></i> Избранное
        </h1>
        
        {favorites.length === 0 ? (
          <div className="favorites-empty">
            <i className="bi bi-heart"></i>
            <h2>Список избранного пуст</h2>
            <p>Добавляйте понравившиеся товары в избранное, чтобы не потерять их</p>
            <Button as={Link} to="/catalog" className="btn-catalog">
              <i className="bi bi-shop"></i> Перейти в каталог
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {favorites.map((item) => (
              <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                <div className="favorites-item-wrapper">
                  <ProductCard product={item} />
                  <button
                    className="btn-remove-favorite"
                    onClick={() => handleRemoveFromFavorites(item.product_id)}
                    title="Удалить из избранного"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Favorites;
