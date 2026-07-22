import './bootstrap';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider, StoreProvider } from './contexts/StoreContext';
import PublicLayout from './layouts/PublicLayout';
import Analytics from './components/Analytics';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import { CartPage, Checkout, OrderSuccess } from './pages/CartCheckout';
import { About, Blog, BlogDetail, CmsPage, Contact, NotFound } from './pages/ContentPages';
import { ProtectedAdmin } from './admin/AdminLayout';
import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import ResourceManager, { OrderDetail, Orders, ProductFormPage, resourceConfigs } from './admin/ResourceManager';
import Settings from './admin/Settings';
import DeliveryCharges from './admin/DeliveryCharges';
import QuoteRequests from './admin/QuoteRequests';
import PushNotifications from './admin/PushNotifications';

function App() {
    return <BrowserRouter>
        <AuthProvider><StoreProvider><CartProvider>
            <Analytics />
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="product/:slug" element={<ProductDetail />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="order-success" element={<OrderSuccess />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="blog" element={<Blog />} />
                    <Route path="blog/:slug" element={<BlogDetail />} />
                    <Route path="page/:slug" element={<CmsPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/cp/login" element={<Login />} />
                <Route path="/cp" element={<ProtectedAdmin />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/:id/edit" element={<ProductFormPage />} />
                    {Object.keys(resourceConfigs).map((resource) => <Route key={resource} path={resource} element={<ResourceManager resource={resource} />} />)}
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="push-notifications" element={<PushNotifications />} />
                    <Route path="delivery-charges" element={<DeliveryCharges />} />
                    <Route path="quote-requests" element={<QuoteRequests />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </CartProvider></StoreProvider></AuthProvider>
    </BrowserRouter>;
}

createRoot(document.getElementById('app')).render(<React.StrictMode><App /></React.StrictMode>);
