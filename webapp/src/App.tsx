import React, { useState } from 'react'
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  HomeOutlined,
  BookOutlined,
  BranchesOutlined,
  ClusterOutlined,
  RiseOutlined,
  ReadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import HomePage from './pages/Home'
import PapersPage from './pages/Papers'
import ThemesPage from './pages/Themes'
import GraphPage from './pages/Graph'
import PaperDetailPage from './pages/PaperDetail'
import WeeklyPage from './pages/Weekly'
import CategoriesPage from './pages/Categories'
import './App.css'

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
    { key: 'graph', icon: <BranchesOutlined />, label: <Link to="/graph">关系图</Link> },
    { key: 'weekly', icon: <RiseOutlined />, label: <Link to="/weekly">每周新品</Link> },
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
    graph: '🔗 关系图',
    paper: '📄 文献详情',
    weekly: '⚡ 每周前沿',
  }
  return titles[pathKey] || '民俗学知识库'
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#5B4A38',
        borderRadius: 6,
        fontFamily: '"PingFang SC", "Source Han Sans", "Noto Serif SC", "Georgia", serif',
      },
    }}>
      <AntApp>
        <HashRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/papers" element={<PapersPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/themes" element={<ThemesPage />} />
              <Route path="/themes/:themeId" element={<ThemesPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/paper/:paperId" element={<PaperDetailPage />} />
              <Route path="/weekly" element={<WeeklyPage />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  )
}
