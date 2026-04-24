import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Category from "./pages/Category";
import ItemsCategory from "./pages/ItemsCategory";
import EntryDetail from "./pages/EntryDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { News, Forums, Library, Account } from "./pages/Placeholder";

function AppRouter() {
  const location = useLocation();
  // Detect session_id in URL fragment synchronously (before normal routes)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/c/items/:sub" element={<ItemsCategory />} />
        <Route path="/c/:category/:sub" element={<Category />} />
        <Route path="/e/:id" element={<EntryDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/news" element={<News />} />
        <Route path="/forums" element={<Forums />} />
        <Route path="/library" element={<Library />} />
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
