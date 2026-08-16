import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import AuthGuard from "./AuthGuard";
import LoginPage from "../features/auth/views/LogIn";
import MainLayout from "../layout/MainLayout";
import SignUpPage from "../features/auth/views/SignUp";
import DashboardScreen from "../features/dashboards/views/DashboardScreen";
import OrdersScreen from "../features/orders/views/OrdersScreen";
import CategoriesScreen from "../features/categories/views/CategoriesScreen";
import ProductsScreen from "../features/products/views/ProductsScreen";
import ClientScreen from "../features/clients/views/Client";
import AddComboPackPage from "../features/combos/views/ComboManager";
import CallRequestsScreen from "../features/callRequests/views/CallRequestsScreen";
import PolitiqueConfidentialite from "../features/legal/views/PolitiqueConfidentialite";
import ConditionUtilisation from "../features/legal/views/ConditionUtilisation";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/conditions-utilisation" element={<ConditionUtilisation />} />
        <Route
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/commandes" element={<OrdersScreen />} />
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/combo" element={<AddComboPackPage/>}/>
          <Route path="/menu" element={<ProductsScreen />} />
          <Route path="/clients" element={<ClientScreen />} />
          <Route path="/demandes-rappel" element={<CallRequestsScreen />} />
 
        </Route>

        <Route path="*" element={<h1>404 - Page introuvable</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
