import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    old_price: '',
    category_id: '',
    stock: '',
    is_new: false,
    is_hit: false
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    setErrorMessage('');
    try {
      const results = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getAllOrders(),
        adminAPI.getAllUsers(),
        adminAPI.getAllProducts(),
        adminAPI.getAllCategories(),
        adminAPI.getReports()
      ]);

      const [statsRes, ordersRes, usersRes, productsRes, categoriesRes, reportsRes] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data);

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        setErrorMessage('Часть данных не загрузилась. Обновите страницу или проверьте backend.');
      }
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
      setErrorMessage('Ошибка загрузки данных админки');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      await adminAPI.deleteProduct(productId);
      await loadData();
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      alert(error.response?.data?.error || 'Не удалось удалить товар');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(newProduct).forEach(([key, value]) => {
        if (key === 'is_new' || key === 'is_hit') {
          formData.append(key, value ? 'true' : 'false');
          return;
        }
        formData.append(key, value ?? '');
      });
      await adminAPI.addProduct(formData);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        old_price: '',
        category_id: '',
        stock: '',
        is_new: false,
        is_hit: false
      });
      await loadData();
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      alert(error.response?.data?.error || 'Не удалось добавить товар');
    }
  };

  const handleEditProduct = async (product) => {
    const name = window.prompt('Название товара', product.name);
    if (name === null || !name.trim()) return;
    const price = window.prompt('Цена', product.price);
    if (price === null || price === '') return;
    const stock = window.prompt('Остаток', product.stock);
    if (stock === null || stock === '') return;
    const categoryId = window.prompt('ID категории', product.category_id || '');
    if (categoryId === null) return;

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', product.description || '');
      formData.append('price', price);
      formData.append('old_price', product.old_price || '');
      formData.append('category_id', categoryId);
      formData.append('stock', stock);
      formData.append('is_new', product.is_new ? 'true' : 'false');
      formData.append('is_hit', product.is_hit ? 'true' : 'false');
      await adminAPI.updateProduct(product.id, formData);
      await loadData();
    } catch (error) {
      console.error('Ошибка редактирования товара:', error);
      alert(error.response?.data?.error || 'Не удалось изменить товар');
    }
  };

  const handleUpdateProductField = async (product, field, value) => {
    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description || '');
      formData.append('price', field === 'price' ? value : product.price);
      formData.append('old_price', product.old_price || '');
      formData.append('category_id', product.category_id || '');
      formData.append('stock', field === 'stock' ? value : product.stock);
      formData.append('is_new', product.is_new ? 'true' : 'false');
      formData.append('is_hit', product.is_hit ? 'true' : 'false');
      await adminAPI.updateProduct(product.id, formData);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      alert(error.response?.data?.error || 'Не удалось обновить товар');
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      await adminAPI.updateUserRole(userId, nextRole);
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      alert(error.response?.data?.error || 'Не удалось изменить роль');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'user'
      });
      await loadData();
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      alert(error.response?.data?.error || 'Не удалось создать пользователя');
    }
  };

  const handleEditUser = async (item) => {
    const name = window.prompt('Имя', item.name || '');
    if (name === null || !name.trim()) return;
    const phone = window.prompt('Телефон', item.phone || '');
    if (phone === null) return;
    const address = window.prompt('Адрес', item.address || '');
    if (address === null) return;
    const role = window.prompt('Роль (admin/user)', item.role);
    if (role === null) return;

    try {
      await adminAPI.updateUser(item.id, {
        name: name.trim(),
        phone,
        address,
        role: role === 'admin' ? 'admin' : 'user'
      });
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      alert(error.response?.data?.error || 'Не удалось обновить пользователя');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Удалить аккаунт пользователя?')) return;
    try {
      await adminAPI.deleteUser(id);
      await loadData();
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      alert(error.response?.data?.error || 'Не удалось удалить пользователя');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addCategory(newCategory);
      setNewCategory({ name: '', description: '', image: '' });
      await loadData();
    } catch (error) {
      console.error('Ошибка добавления категории:', error);
      alert(error.response?.data?.error || 'Не удалось добавить категорию');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Удалить категорию?')) return;
    try {
      await adminAPI.deleteCategory(categoryId);
      await loadData();
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      alert(error.response?.data?.error || 'Не удалось удалить категорию');
    }
  };

  const renderReportTable = (title, rows) => {
    if (!rows || rows.length === 0) {
      return (
        <Card className="data-card mb-4" key={title}>
          <Card.Header><h5 className="mb-0">{title}</h5></Card.Header>
          <Card.Body className="p-3"><span className="text-muted">Данных пока нет</span></Card.Body>
        </Card>
      );
    }

    const columns = Object.keys(rows[0]);
    return (
      <Card className="data-card mb-4" key={title}>
        <Card.Header><h5 className="mb-0">{title}</h5></Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover className="modern-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((column) => (
                      <td key={`${idx}-${column}`}>{String(row[column] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger'
    };
    
    const labels = {
      pending: 'В обработке',
      confirmed: 'Подтверждён',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён'
    };
    
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <i className="bi bi-lightning-charge-fill"></i>
          <span>TrailTech Admin</span>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">Администратор</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Панель управления</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="bi bi-bag-check"></i>
            <span>Заказы</span>
            {stats?.totalOrders > 0 && (
              <Badge bg="primary" className="ms-auto">{stats.totalOrders}</Badge>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i className="bi bi-box-seam"></i>
            <span>Товары</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people"></i>
            <span>Пользователи</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <i className="bi bi-grid"></i>
            <span>Категории</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="bi bi-bar-chart"></i>
            <span>Отчеты</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <Link to="/" className="nav-item">
            <i className="bi bi-arrow-left"></i>
            <span>На сайт</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {errorMessage && (
          <div className="alert alert-warning admin-alert" role="alert">
            {errorMessage}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div className="content-header">
              <h1>Панель управления</h1>
              <p className="text-muted">Обзор ключевых метрик магазина</p>
            </div>
            
            {/* Stats Grid */}
            <Row className="g-4 mb-4">
              <Col md={6} xl={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="stat-icon bg-primary">
                      <i className="bi bi-people"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Пользователи</div>
                      <div className="stat-value">{stats?.totalUsers || 0}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} xl={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="stat-icon bg-success">
                      <i className="bi bi-box-seam"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Товары</div>
                      <div className="stat-value">{stats?.totalProducts || 0}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} xl={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="stat-icon bg-warning">
                      <i className="bi bi-bag-check"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Заказы</div>
                      <div className="stat-value">{stats?.totalOrders || 0}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} xl={3}>
                <Card className="stat-card">
                  <Card.Body>
                    <div className="stat-icon bg-info">
                      <i className="bi bi-currency-dollar"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Выручка</div>
                      <div className="stat-value">{(stats?.totalRevenue || 0).toLocaleString()} ₽</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Recent Orders */}
            <Card className="data-card">
              <Card.Header>
                <h5 className="mb-0">Последние заказы</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setActiveTab('orders')}
                >
                  Все заказы <i className="bi bi-arrow-right"></i>
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="modern-table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Клиент</th>
                        <th>Email</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentOrders?.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>{order.user_name || order.name || 'Гость'}</td>
                          <td className="text-muted">{order.email}</td>
                          <td><strong>{order.total_amount.toLocaleString()} ₽</strong></td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td className="text-muted">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
        
        {activeTab === 'orders' && (
          <>
            <div className="content-header">
              <h1>Управление заказами</h1>
              <p className="text-muted">Все заказы магазина</p>
            </div>
            
            <Card className="data-card">
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="modern-table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Клиент</th>
                        <th>Контакты</th>
                        <th>Товары</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Дата</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>{order.user_name || order.name || 'Гость'}</td>
                          <td>
                            <div className="text-muted small">
                              <div>{order.email}</div>
                              <div>{order.phone}</div>
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              {order.items?.slice(0, 2).map((item, idx) => (
                                <div key={idx}>{item.name} x{item.quantity}</div>
                              ))}
                              {order.items?.length > 2 && (
                                <div className="text-muted">+{order.items.length - 2} ещё</div>
                              )}
                            </div>
                          </td>
                          <td><strong>{order.total_amount.toLocaleString()} ₽</strong></td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td className="text-muted">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td>
                            <div className="btn-group-sm">
                              {order.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="success"
                                  onClick={() => handleStatusChange(order.id, 'confirmed')}
                                >
                                  <i className="bi bi-check"></i>
                                </Button>
                              )}
                              {order.status === 'confirmed' && (
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  onClick={() => handleStatusChange(order.id, 'shipped')}
                                >
                                  <i className="bi bi-truck"></i>
                                </Button>
                              )}
                              {order.status === 'shipped' && (
                                <Button 
                                  size="sm" 
                                  variant="info"
                                  onClick={() => handleStatusChange(order.id, 'delivered')}
                                >
                                  <i className="bi bi-box-seam"></i>
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline-danger"
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                              >
                                <i className="bi bi-x"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
        
        {activeTab === 'products' && (
          <>
            <div className="content-header">
              <h1>Управление товарами</h1>
              <p className="text-muted">Добавление, редактирование и удаление товаров</p>
            </div>

            <Card className="data-card mb-4">
              <Card.Header><h5 className="mb-0">Добавить товар</h5></Card.Header>
              <Card.Body className="p-3">
                <Form onSubmit={handleCreateProduct} className="admin-grid-form">
                  <Form.Control
                    placeholder="Название товара"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Цена"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Старая цена"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.old_price}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, old_price: e.target.value }))}
                  />
                  <Form.Select
                    required
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control
                    placeholder="Остаток"
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Описание"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Новинка"
                    checked={newProduct.is_new}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, is_new: e.target.checked }))}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Хит"
                    checked={newProduct.is_hit}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, is_hit: e.target.checked }))}
                  />
                  <Button type="submit" variant="primary">Добавить товар</Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="data-card">
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="modern-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Категория</th>
                        <th>Цена</th>
                        <th>Остаток</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td><strong>#{product.id}</strong></td>
                          <td>{product.name}</td>
                          <td className="text-muted">{product.category_name || '—'}</td>
                          <td><strong>{Number(product.price).toLocaleString('ru-RU')} ₽</strong></td>
                          <td>{product.stock}</td>
                          <td>
                            <div className="btn-group-sm">
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => {
                                  const value = window.prompt('Новая цена', product.price);
                                  if (value !== null && value !== '') handleUpdateProductField(product, 'price', value);
                                }}
                              >
                                Цена
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-warning"
                                onClick={() => {
                                  const value = window.prompt('Новый остаток', product.stock);
                                  if (value !== null && value !== '') handleUpdateProductField(product, 'stock', value);
                                }}
                              >
                                Остаток
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteProduct(product.id)}>
                                Удалить
                              </Button>
                              <Button size="sm" variant="outline-primary" onClick={() => handleEditProduct(product)}>
                                Изменить
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
        
        {activeTab === 'users' && (
          <>
            <div className="content-header">
              <h1>Управление пользователями</h1>
              <p className="text-muted">Создание аккаунтов, роли и удаление пользователей</p>
            </div>

            <Card className="data-card mb-4">
              <Card.Header><h5 className="mb-0">Добавить пользователя</h5></Card.Header>
              <Card.Body className="p-3">
                <Form onSubmit={handleCreateUser} className="admin-grid-form">
                  <Form.Control
                    placeholder="Имя"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Пароль"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Телефон"
                    value={newUser.phone}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Адрес"
                    value={newUser.address}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, address: e.target.value }))}
                  />
                  <Form.Select
                    value={newUser.role}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </Form.Select>
                  <Button type="submit" variant="primary">Создать аккаунт</Button>
                </Form>
              </Card.Body>
            </Card>
            
            <Card className="data-card">
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="modern-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Роль</th>
                        <th>Telegram ID</th>
                        <th>Дата регистрации</th>
                        <th>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td><strong>#{user.id}</strong></td>
                          <td>{user.name}</td>
                          <td className="text-muted">{user.email}</td>
                          <td className="text-muted">{user.phone || '—'}</td>
                          <td>
                            <Badge bg={user.role === 'admin' ? 'danger' : 'secondary'}>
                              {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </Badge>
                          </td>
                          <td className="text-muted">{user.telegram_id || '—'}</td>
                          <td className="text-muted">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td>
                            <div className="btn-group-sm">
                              {user.role === 'admin' ? (
                                <Button size="sm" variant="outline-secondary" onClick={() => handleRoleChange(user.id, 'user')}>
                                  Сделать user
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline-danger" onClick={() => handleRoleChange(user.id, 'admin')}>
                                  Сделать admin
                                </Button>
                              )}
                              <Button size="sm" variant="outline-primary" onClick={() => handleEditUser(user)}>
                                Изменить
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteUser(user.id)}>
                                Удалить
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="content-header">
              <h1>Управление категориями</h1>
              <p className="text-muted">Работа с таблицей categories</p>
            </div>

            <Card className="data-card mb-4">
              <Card.Header><h5 className="mb-0">Добавить категорию</h5></Card.Header>
              <Card.Body className="p-3">
                <Form onSubmit={handleCreateCategory} className="category-form">
                  <Form.Control
                    placeholder="Название"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Form.Control
                    placeholder="Описание"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <Form.Control
                    placeholder="Ссылка на изображение"
                    value={newCategory.image}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, image: e.target.value }))}
                  />
                  <Button type="submit" variant="primary">Добавить</Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="data-card">
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="modern-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Товаров</th>
                        <th>Дата</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td><strong>#{category.id}</strong></td>
                          <td>{category.name}</td>
                          <td>{category.products_count}</td>
                          <td className="text-muted">{new Date(category.created_at).toLocaleDateString('ru-RU')}</td>
                          <td>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCategory(category.id)}>
                              Удалить
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <div className="content-header">
              <h1>Отчеты БД</h1>
              <p className="text-muted">Аналитика интернет-магазина TrailTech</p>
            </div>
            {renderReportTable('Продажи по категориям (report_sales_by_category)', reports.report_sales_by_category)}
            {renderReportTable('Заказы по статусам (report_orders_by_status)', reports.report_orders_by_status)}
            {renderReportTable('Топ клиентов (report_top_customers)', reports.report_top_customers)}
            {renderReportTable('Остатки и рейтинг по категориям (report_inventory_by_category)', reports.report_inventory_by_category)}
            {renderReportTable('Топ товаров по выручке (report_top_products)', reports.report_top_products)}
            {renderReportTable('Ежедневные продажи (report_daily_sales)', reports.report_daily_sales)}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
