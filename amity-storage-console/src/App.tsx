import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Buckets from './pages/Buckets'
import BucketDetail from './pages/BucketDetail'
import Objects from './pages/Objects'
import Pipeline from './pages/Pipeline'
import SearchPage from './pages/SearchPage'
import Access from './pages/Access'
import Policies from './pages/Policies'
import Categories from './pages/Categories'
import Audit from './pages/Audit'
import Developers from './pages/Developers'
import ApiReference from './pages/ApiReference'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/buckets" element={<Buckets />} />
        <Route path="/buckets/:id" element={<BucketDetail />} />
        <Route path="/objects" element={<Objects />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/access" element={<Access />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/developers/api" element={<ApiReference />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
