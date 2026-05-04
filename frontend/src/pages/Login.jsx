import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login(formData.email, formData.password);
      // Перенаправляем админа в админку, остальных на главную
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          <i className="bi bi-box-arrow-in-right"></i> Вход
        </h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Введите email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            className="btn-auth w-100"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Form>
        
        <div className="auth-footer">
          <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
