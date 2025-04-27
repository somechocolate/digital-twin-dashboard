// src/components/common/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          Ups, da ist etwas schiefgelaufen. Bitte lade die Seite neu.
        </div>
      );
    }
    return this.props.children;
  }
}
