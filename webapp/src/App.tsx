import React, { useState, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, App as AntApp, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  HomeOutlined,
  BookOutlined,
  ClusterOutlined,
  RiseOutlined,
  ReadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import HomePage from './pages/Home'
// 首屏之外的页面走懒加载，减少首次加载体积
const PapersPage = lazy(() => import('./pages/Papers'))
const ThemesPage = lazy(() => import('./pages/Themes'))
const PaperDetailPage = lazy(() => import('./pages/PaperDetail'))
const WeeklyPage = lazy(() => import('./pages/Weekly'))
const CategoriesPage = lazy(() => import('./pages/Categories'))
import './App.css'

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

const { Header, Sider, Content } = Layout

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const pathKey = location.pathname.split('/')[1] || 'home'

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: <Link to="/home">首页</Link> },
    { key: 'papers', icon: <BookOutlined />, label: <Link to="/papers">文献库</Link> },
    { key: 'categories', icon: <AppstoreOutlined />, label: <Link to="/categories">分类目录</Link> },
    { key: 'themes', icon: <ClusterOutlined />, label: <Link to="/themes">主题综述</Link> },
    { key: 'weekly', icon: <RiseOutlined />, label: <Link to="/weekly">新作速览</Link> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={220}>
        <div className="app-logo">
          <ReadOutlined />
          {!collapsed && <span className="app-logo-title">民俗学知识库</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathKey === 'paper' ? 'papers' : pathKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <span className="header-title">
            {getHeaderTitle(pathKey)}
          </span>
          <span className="header-sub">Folklore Studies · Anthropology · Heritage</span>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}

function getHeaderTitle(pathKey: string): string {
  const titles: Record<string, string> = {
    home: '📚 首页',
    papers: '📖 文献库',
    categories: '🗂️ 分类目录',
    themes: '🧭 主题综述',
    paper: '📄 文献详情',
    weekly: '⚡ 新作速览',
  }
  return titles[pathKey] || '民俗学知识库'
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#2c3e50',
        colorLink: '#2c3e50',
        colorLinkHover: '#b08d57',
        borderRadius: 4,
        fontFamily: '"PingFang SC", "Source Han Sans", "Noto Serif SC", "Georgia", serif',
      },
    }}>
      <AntApp>
        <HashRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/papers" element={<Suspense fallback={<PageLoading />}><PapersPage /></Suspense>} />
              <Route path="/categories" element={<Suspense fallback={<PageLoading />}><CategoriesPage /></Suspense>} />
              <Route path="/themes" element={<Suspense fallback={<PageLoading />}><ThemesPage /></Suspense>} />
              <Route path="/themes/:themeId" element={<Suspense fallback={<PageLoading />}><ThemesPage /></Suspense>} />
              <Route path="/paper/:paperId" element={<Suspense fallback={<PageLoading />}><PaperDetailPage /></Suspense>} />
              <Route path="/weekly" element={<Suspense fallback={<PageLoading />}><WeeklyPage /></Suspense>} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  )
}
