/**
 * 独立公网部署配置（Vercel / Netlify / GitHub Pages）
 * 使用：
 *   VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx \
 *     npx vite build --config vite.config.standalone.ts
 *
 * 与 vite.config.ts 的区别：
 *   - 不用 qiankun 包装
 *   - base 用 './'（相对路径，方便任何托管平台）
 *   - 需要 Supabase env
 */
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      '\n⚠️  未检测到 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。\n' +
        '   前端将无法连接数据库。请在 Vercel Environment Variables 里配置。\n',
    )
  }

  // GitHub Pages 用子路径部署（luy89012-netizen.github.io/folklore-kb/）
  // 通过 VITE_BASE_PATH 覆盖；默认相对路径
  const basePath = env.VITE_BASE_PATH || './'

  return {
    plugins: [react()],
    base: basePath,
    build: {
      outDir: 'dist-standalone',
      assetsDir: 'assets',
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'antd-vendor': ['antd', '@ant-design/icons'],
          },
        },
      },
    },
    server: { port: 5173 },
  }
})
