import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Dropdown, FloatingLabel } from 'react-bootstrap';
import { productsAPI, categoriesAPI } from '../api';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoriesAPI.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;
        if (sortBy !== 'default') params.sort = sortBy;
        if (searchParams.get('new') === 'true') params.new = true;
        if (searchParams.get('hit') === 'true') params.hit = true;
        
        const { data } = await productsAPI.getAll(params);
        setProducts(data);
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, searchParams]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    const newParams = new URLSearchParams(searchParams);
    if (value !== 'default') {
      newParams.set('sort', value);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('default');
    setSearchParams({});
  };

  return (
    <div className="catalog-page">
      {/* Hero Banner */}
      <div className="catalog-hero">
        <Container>
          <h1>Каталог товаров</h1>
          <p>Выберите лучшее снаряжение для ваших приключений</p>
        </Container>
      </div>

      <Container className="catalog-container">
        {/* Filters Sidebar */}
        <Row className="g-4">
          <Col lg={3}>
            <div className="filters-sidebar">
              <div className="filters-header">
                <h3><i className="bi bi-funnel"></i> Фильтры</h3>
                <Button variant="link" onClick={clearFilters} className="reset-btn">
                  <i className="bi bi-x-circle"></i> Сбросить
                </Button>
              </div>

              {/* Search */}
              <div className="filter-group">
                <label>Поиск</label>
                <Form onSubmit={handleSearch}>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Найти товар..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit"><i className="bi bi-search"></i></button>
                  </div>
                </Form>
              </div>

              {/* Categories */}
              <div className="filter-group">
                <label><i className="bi bi-grid"></i> Категории</label>
                <div className="categories-list">
                  <button 
                    className={`category-item ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('')}
                  >
                    Все категории
                  </button>
                  {categories.map((category) => (
                    <button 
                      key={category.id} 
                      className={`category-item ${selectedCategory == category.id ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                      <span className="count">{category.products_count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="filter-group">
                <label><i className="bi bi-sort-down"></i> Сортировка</label>
                <div className="sort-options">
                  <button 
                    className={`sort-item ${sortBy === 'default' ? 'active' : ''}`}
                    onClick={() => handleSortChange('default')}
                  >
                    По умолчанию
                  </button>
                  <button 
                    className={`sort-item ${sortBy === 'price_asc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('price_asc')}
                  >
                    <i className="bi bi-arrow-down"></i> Сначала дешевле
                  </button>
                  <button 
                    className={`sort-item ${sortBy === 'price_desc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('price_desc')}
                  >
                    <i className="bi bi-arrow-up"></i> Сначала дороже
                  </button>
                  <button 
                    className={`sort-item ${sortBy === 'rating' ? 'active' : ''}`}
                    onClick={() => handleSortChange('rating')}
                  >
                    <i className="bi bi-star"></i> По рейтингу
                  </button>
                  <button 
                    className={`sort-item ${sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('newest')}
                  >
                    <i className="bi bi-clock"></i> Новинки
                  </button>
                </div>
              </div>
            </div>
          </Col>

          {/* Products Grid */}
          <Col lg={9}>
            <div className="products-header">
              <div className="products-count">
                <span className="count-badge">{products.length}</span> товаров найдено
              </div>
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="bi bi-grid"></i>
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="bi bi-list"></i>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Загружаем товары...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-search"></i>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска или выбрать другую категорию</p>
                <Button onClick={clearFilters} className="btn-show-all">
                  Показать все товары
                </Button>
              </div>
            ) : (
              <div className={`products-grid view-${viewMode}`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Catalog;
