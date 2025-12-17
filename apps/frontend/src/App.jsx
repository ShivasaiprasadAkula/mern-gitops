import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
	return (
		<AuthProvider>
			<ChatProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/login" element={<AuthPage />} />
						<Route path="/register" element={<AuthPage />} />
						<Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
						<Route path="/" element={<Navigate to="/chat" />} />
					</Routes>
				</BrowserRouter>
			</ChatProvider>
		</AuthProvider>
	);
}
