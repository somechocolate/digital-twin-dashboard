import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TwinProvider } from './context/TwinContext';
import Tabs from './components/common/Tabs';
import ModeBadge from './components/common/ModeBadge';
import ErrorBoundary from './components/common/ErrorBoundary';


import React, { Suspense, lazy } from 'react';

const ChatPage = lazy(() => import('./pages/ChatPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const SystemPage = lazy(() => import('./pages/SystemPage'));
const TestingPage = lazy(() => import('./pages/TestingPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));

export default function App() {
    return (
        <TwinProvider>
            <BrowserRouter>
                <header className="p-4 flex justify-between items-center border-b">
                    <Tabs />
                    <ModeBadge />
                </header>

                <main className="p-4">
                    <ErrorBoundary>
                        <Suspense fallback={<div>Loading…</div>}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/features" />} />
                                <Route path="/chat" element={<ChatPage />} />
                                <Route path="/system" element={<SystemPage />} />
                                <Route path="/features" element={<FeaturesPage />} />
                                <Route path="/testing" element={<TestingPage />} />
                                <Route path="/changelog" element={<ChangelogPage />} />
                                <Route path="*" element={<Navigate to="/features" replace />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </BrowserRouter>
        </TwinProvider>
    );
}
