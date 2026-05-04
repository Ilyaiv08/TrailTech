import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import About from './pages/About';
import Contacts from './pages/Contacts';
import Admin from './pages/Admin';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

// Защищенный маршрут
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-page">
        <i className="bi bi-arrow-repeat"></i>
        <p>Загрузка...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin route without header/footer */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            
            {/* Regular routes with header/footer */}
            <Route path="*" element={
              <div className="app">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contacts" element={<Contacts />} />
                    
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/orders" 
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/favorites" 
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
