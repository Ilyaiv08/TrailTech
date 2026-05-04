import { Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const cartCount = getItemCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <Navbar expand="lg" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" className="header-brand">
            <i className="bi bi-lightning-charge-fill"></i>
            TrailTech
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/catalog">Каталог</Nav.Link>
              <Nav.Link as={Link} to="/about">О нас</Nav.Link>
              <Nav.Link as={Link} to="/contacts">Контакты</Nav.Link>
            </Nav>
            
            <Nav className="align-items-center">
              {user ? (
                <>
                  <Nav.Link as={Link} to="/favorites">
                    <i className="bi bi-heart"></i>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/cart" className="position-relative">
                    <i className="bi bi-cart3"></i>
                    {cartCount > 0 && (
                      <span className="cart-badge">{cartCount}</span>
                    )}
                  </Nav.Link>
                  <NavDropdown 
                    title={<span><i className="bi bi-person-circle"></i> {user.name}</span>} 
                    id="user-dropdown"
                    align="end"
                  >
                    <NavDropdown.Item as={Link} to="/profile">
                      <i className="bi bi-person"></i> Профиль
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/orders">
                      <i className="bi bi-bag"></i> Мои заказы
                    </NavDropdown.Item>
                    {isAdmin && (
                      <NavDropdown.Item as={Link} to="/admin">
                        <i className="bi bi-gear"></i> Админ-панель
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right"></i> Выйти
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">
                    <i className="bi bi-box-arrow-in-right"></i> Вход
                  </Nav.Link>
                  <Nav.Link as={Link} to="/cart" className="position-relative">
                    <i className="bi bi-cart3"></i>
                    {cartCount > 0 && (
                      <span className="cart-badge">{cartCount}</span>
                    )}
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
