import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(formData.name, formData.email, formData.password, formData.phone);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <h2 className="auth-title">
          <i className="bi bi-person-plus"></i> Регистрация
        </h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>ФИО</Form.Label>
            <Form.Control
              type="text"
              placeholder="Иванов Иван"
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
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Подтверждение пароля</Form.Label>
            <Form.Control
              type="password"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            className="btn-auth w-100"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Form>
        
        <div className="auth-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
