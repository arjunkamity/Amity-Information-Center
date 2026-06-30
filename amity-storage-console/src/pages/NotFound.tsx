import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Card, Empty } from '../components/ui'

export default function NotFound() {
  return (
    <Card className="mt-4">
      <Empty icon={<Compass size={36} />} title="Page not found" sub="The page you're looking for doesn't exist." />
      <div style={{ textAlign: 'center', paddingBottom: 32 }}>
        <Link to="/" className="btn primary">Back to dashboard</Link>
      </div>
    </Card>
  )
}
