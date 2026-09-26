/* ============================================================
   SHIELD — entrypoint.
   Starts the mock telemetry stream (swappable for MQTT/hardware)
   and mounts the command center.
   ============================================================ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { startShieldStream } from './dataflow/engine';
import './index.css';

// Boot the telemetry pipeline immediately so every page has
// live data on first paint. Swappable via DataSourceAdapter.
startShieldStream();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);