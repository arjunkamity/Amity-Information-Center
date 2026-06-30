import { Link } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import { Card, CardHead, Badge } from '../components/ui'
import { CodeBlock } from '../components/Code'
import type { Tone } from '../components/ui'

const ENDPOINT = 'https://s3.amity.internal'

const methodTone: Record<string, Tone> = {
  GET: 'green', PUT: 'blue', POST: 'purple', DELETE: 'red', HEAD: 'gray',
}

interface Op { method: string; path: string; desc: string }
const groups: { title: string; ops: Op[] }[] = [
  {
    title: 'Buckets',
    ops: [
      { method: 'PUT', path: '/{bucket}', desc: 'Create a bucket' },
      { method: 'DELETE', path: '/{bucket}', desc: 'Delete an (empty) bucket' },
      { method: 'GET', path: '/', desc: 'List all buckets' },
      { method: 'GET', path: '/{bucket}?location', desc: 'Get bucket region' },
      { method: 'PUT', path: '/{bucket}?policy', desc: 'Set bucket policy (JSON)' },
      { method: 'GET', path: '/{bucket}?policy', desc: 'Get bucket policy' },
      { method: 'PUT', path: '/{bucket}?cors', desc: 'Set CORS configuration' },
      { method: 'PUT', path: '/{bucket}?versioning', desc: 'Enable/suspend versioning' },
      { method: 'PUT', path: '/{bucket}?lifecycle', desc: 'Set lifecycle / retention rules' },
    ],
  },
  {
    title: 'Objects',
    ops: [
      { method: 'PUT', path: '/{bucket}/{key}', desc: 'Upload / create an object' },
      { method: 'GET', path: '/{bucket}/{key}', desc: 'Download an object' },
      { method: 'HEAD', path: '/{bucket}/{key}', desc: 'Get object metadata only' },
      { method: 'DELETE', path: '/{bucket}/{key}', desc: 'Delete an object' },
      { method: 'GET', path: '/{bucket}?list-type=2', desc: 'List objects (prefix, paginated)' },
      { method: 'POST', path: '/{bucket}/{key}?uploads', desc: 'Initiate multipart upload' },
      { method: 'PUT', path: '/{bucket}/{key}?partNumber', desc: 'Upload a part' },
      { method: 'POST', path: '/{bucket}/{key}?uploadId', desc: 'Complete multipart upload' },
      { method: 'PUT', path: '/{bucket}/{key} (x-amz-copy-source)', desc: 'Copy an object' },
    ],
  },
]

export default function ApiReference() {
  return (
    <>
      <div className="breadcrumb">
        <Link to="/developers">Developers</Link>
        <ChevronRight size={13} className="sep" />
        <span>API Reference</span>
      </div>

      <div className="page-head">
        <div>
          <h1>API Reference</h1>
          <div className="desc">Amity&#39;s S3-compatible REST API. All standard S3 operations are supported against the Amity endpoint — use any S3 SDK or the Amity CLI.</div>
        </div>
        <Link to="/developers" className="btn"><BookOpen size={15} /> Integration Guide</Link>
      </div>

      <Card className="card-pad mb-4">
        <h3 className="mb-3">Base endpoint &amp; auth</h3>
        <p className="muted mb-3">Authenticate every request with <strong>S3 Signature V4</strong> using your Access Key ID and Secret. SDKs and the Amity CLI handle signing automatically. Use <span className="mono">forcePathStyle</span> (path-style URLs).</p>
        <CodeBlock id="base" language="http" code={`Base URL:   ${ENDPOINT}
Auth:       S3 Signature Version 4 (header: Authorization)
Style:      Path-style  →  ${ENDPOINT}/{bucket}/{key}
Region:     on-prem-dc1 | on-prem-dc2
TLS:        Required (HTTPS only)`} />
      </Card>

      {groups.map((g) => (
        <Card key={g.title} className="mb-4">
          <CardHead title={g.title} sub={`${g.ops.length} operations`} />
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th style={{ width: 90 }}>Method</th><th>Path</th><th>Description</th></tr>
              </thead>
              <tbody>
                {g.ops.map((op, i) => (
                  <tr key={i}>
                    <td><Badge tone={methodTone[op.method] ?? 'gray'}>{op.method}</Badge></td>
                    <td className="mono text-sm" style={{ color: 'var(--accent)' }}>{op.path}</td>
                    <td className="muted">{op.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <div className="banner info"><span>Request/response semantics follow the standard S3 API. See the <Link to="/developers" style={{ color: 'var(--brand-2)' }}>Integration Guide</Link> for working code via the Amity CLI, Node.js, Python, Swift and Kotlin.</span></div>
    </>
  )
}
