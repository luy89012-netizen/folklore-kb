/**
 * 独立部署入口（Vercel/Netlify/GitHub Pages）
 * 完全不引入 qiankun，直接 mount 到 #miniapp-root
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './theme.css'
import './main.css'

const container = document.getElementById('miniapp-root')
if (!container) throw new Error('找不到 #miniapp-root 挂载点')
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
