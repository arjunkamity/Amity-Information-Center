import { Link } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import { Card, Badge } from '../components/ui'
import { CodeBlock } from '../components/Code'
import type { Tone } from '../components/ui'

const ENDPOINT = 'https://s3.amity.internal'

const methodTone: Record<string, Tone> = {
  GET: 'green', PUT: 'blue', POST: 'purple', DELETE: 'red', HEAD: 'gray',
}

interface DetailedOp {
  id: string
  method: string
  path: string
  title: string
  desc: string
  request?: string
  requestLang?: string
  status: string
  response: string
  responseLang?: string
}

const sections: { title: string; note?: string; ops: DetailedOp[] }[] = [
  {
    title: 'Buckets',
    ops: [
      {
        id: 'create-bucket', method: 'PUT', path: '/{bucket}', title: 'Create a bucket', status: '201 Created',
        desc: 'Provision a bucket. The caller becomes its owner and sole administrator.',
        request: `PUT /amity-my-app
Host: s3.amity.internal
Authorization: AWS4-HMAC-SHA256 Credential=AMITY7F3K9QX2LMP0WD1/...
Content-Type: application/json

{
  "region": "on-prem-dc1",
  "categoryId": "cat-app",
  "visibility": "private",
  "versioning": true,
  "encryption": true
}`,
        response: `{
  "id": "b-1720000000000",
  "name": "amity-my-app",
  "owner": "you",
  "region": "on-prem-dc1",
  "visibility": "private",
  "status": "provisioning",
  "versioning": true,
  "encryption": true,
  "createdAt": "2026-07-01T09:00:00Z"
}`,
      },
      {
        id: 'list-buckets', method: 'GET', path: '/', title: 'List buckets', status: '200 OK',
        desc: 'List all buckets the caller can access.',
        response: `{
  "buckets": [
    {
      "name": "amity-web-public",
      "visibility": "public",
      "region": "on-prem-dc1",
      "objectCount": 184302,
      "sizeBytes": 412000000000,
      "createdAt": "2025-01-14"
    },
    {
      "name": "amity-my-app",
      "visibility": "private",
      "region": "on-prem-dc1",
      "objectCount": 0,
      "sizeBytes": 0,
      "createdAt": "2026-07-01"
    }
  ],
  "count": 2
}`,
      },
      {
        id: 'delete-bucket', method: 'DELETE', path: '/{bucket}', title: 'Delete a bucket', status: '204 No Content',
        desc: 'Delete an empty bucket. Owner only. Returns 409 if the bucket still contains objects.',
        request: `DELETE /amity-my-app
Authorization: AWS4-HMAC-SHA256 ...`,
        response: `{ "deleted": true, "name": "amity-my-app" }`,
      },
    ],
  },
  {
    title: 'Objects — read & write',
    note: 'Every write carries an access flag: "public" (served at its direct URL) or "private" (presigned-only). The same bucket can hold both.',
    ops: [
      {
        id: 'put-object', method: 'PUT', path: '/{bucket}/{key}', title: 'Upload (PUT) an object', status: '200 OK',
        desc: 'Create or overwrite an object. Set x-amz-acl to flag it public or private (presigned-only, the default).',
        request: `PUT /amity-web-public/web/logo.svg
Host: s3.amity.internal
Content-Type: image/svg+xml
Content-Length: 20480
x-amz-acl: public-read          # or "private" (default) = presigned-only
Authorization: AWS4-HMAC-SHA256 ...

<binary object bytes>`,
        response: `{
  "bucket": "amity-web-public",
  "key": "web/logo.svg",
  "etag": "\\"9b2cf5a1c3e04f7d8a1b2c3d4e5f6071\\"",
  "size": 20480,
  "contentType": "image/svg+xml",
  "access": "public",
  "directUrl": "https://cdn.amity.edu/web/logo.svg",
  "versionId": "v1-8f3a2c",
  "uploadedAt": "2026-07-01T09:22:00Z"
}`,
      },
      {
        id: 'get-object', method: 'GET', path: '/{bucket}/{key}', title: 'Download (GET) an object', status: '200 OK',
        desc: 'Stream an object’s bytes. Works directly only for public objects; private objects require a presigned URL (see below).',
        request: `GET /amity-web-public/web/logo.svg
Authorization: AWS4-HMAC-SHA256 ...`,
        requestLang: 'http',
        responseLang: 'http',
        response: `200 OK
Content-Type: image/svg+xml
Content-Length: 20480
ETag: "9b2cf5a1c3e04f7d8a1b2c3d4e5f6071"
Last-Modified: Tue, 01 Jul 2026 09:22:00 GMT
x-amz-meta-access: public

<binary object bytes>`,
      },
      {
        id: 'head-object', method: 'HEAD', path: '/{bucket}/{key}', title: 'Object metadata (HEAD)', status: '200 OK',
        desc: 'Fetch metadata only — size, type, access flag, enrichment status — without the body.',
        response: `{
  "key": "uploads/report.pdf",
  "size": 482913,
  "contentType": "application/pdf",
  "etag": "\\"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6\\"",
  "access": "private",
  "enrichment": "searchable",
  "tags": ["report", "finance"],
  "versionId": "v3-1a2b3c",
  "lastModified": "2026-06-30T10:12:00Z"
}`,
      },
      {
        id: 'list-objects', method: 'GET', path: '/{bucket}?list-type=2&prefix=', title: 'List objects', status: '200 OK',
        desc: 'List objects under a prefix, paginated. Each entry includes its access flag.',
        request: `GET /amity-my-app?list-type=2&prefix=uploads/&max-keys=100
Authorization: AWS4-HMAC-SHA256 ...`,
        response: `{
  "bucket": "amity-my-app",
  "prefix": "uploads/",
  "keyCount": 2,
  "isTruncated": false,
  "nextContinuationToken": null,
  "objects": [
    {
      "key": "uploads/report.pdf",
      "size": 482913,
      "etag": "\\"a1b2c3d4...\\"",
      "access": "private",
      "storageClass": "STANDARD",
      "lastModified": "2026-06-30T10:12:00Z"
    },
    {
      "key": "uploads/banner.webp",
      "size": 240128,
      "etag": "\\"f0e1d2c3...\\"",
      "access": "public",
      "storageClass": "STANDARD",
      "lastModified": "2026-06-29T08:00:00Z"
    }
  ]
}`,
      },
      {
        id: 'delete-object', method: 'DELETE', path: '/{bucket}/{key}', title: 'Delete an object', status: '204 No Content',
        desc: 'Delete an object (or a specific version on a versioned bucket).',
        request: `DELETE /amity-my-app/uploads/report.pdf
Authorization: AWS4-HMAC-SHA256 ...`,
        response: `{
  "deleted": true,
  "bucket": "amity-my-app",
  "key": "uploads/report.pdf",
  "versionId": "v3-1a2b3c"
}`,
      },
    ],
  },
  {
    title: 'Access control — public vs presigned',
    note: 'How the public / presigned-only flag is set, read, and enforced.',
    ops: [
      {
        id: 'set-acl', method: 'PUT', path: '/{bucket}/{key}?acl', title: 'Change an object’s access flag', status: '200 OK',
        desc: 'Flip an existing object between public (direct URL) and private (presigned-only). Owner / writer only.',
        request: `PUT /amity-web-public/web/logo.svg?acl
Content-Type: application/json
Authorization: AWS4-HMAC-SHA256 ...

{ "access": "public" }          // "public" | "private"`,
        response: `{
  "key": "web/logo.svg",
  "access": "public",
  "directUrl": "https://cdn.amity.edu/web/logo.svg"
}`,
      },
      {
        id: 'presign', method: 'POST', path: '/{bucket}/{key}?presign', title: 'Generate a presigned URL', status: '200 OK',
        desc: 'Mint a short-lived signed URL for a private object. Signed server-side; the secret key never leaves the server, and the link expires.',
        request: `POST /amity-my-app/uploads/report.pdf?presign
Content-Type: application/json
Authorization: AWS4-HMAC-SHA256 ...

{
  "method": "GET",              // GET (download) | PUT (upload)
  "expiresIn": 900              // seconds
}`,
        response: `{
  "url": "${ENDPOINT}/amity-my-app/uploads/report.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AMITY7F3K9QX2LMP0WD1%2F20260701%2Fon-prem-dc1%2Fs3%2Faws4_request&X-Amz-Date=20260701T093000Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=4b2f...e91a",
  "method": "GET",
  "expiresIn": 900,
  "expiresAt": "2026-07-01T09:45:00Z"
}`,
      },
      {
        id: 'forbidden', method: 'GET', path: '/{bucket}/{key}', title: 'Direct access to a private object', status: '403 Forbidden',
        desc: 'Hitting the direct URL of a presigned-only object is denied. This is what keeps sensitive data off public URLs.',
        request: `GET /amity-my-app/uploads/report.pdf
# no presigned query params, object access = "private"`,
        response: `{
  "error": "AccessDenied",
  "message": "This object is presigned-only. Request a presigned URL to access it.",
  "bucket": "amity-my-app",
  "key": "uploads/report.pdf",
  "requestId": "amity-4kn52-bb68b98b8629"
}`,
      },
    ],
  },
  {
    title: 'Bucket configuration',
    ops: [
      {
        id: 'put-policy', method: 'PUT', path: '/{bucket}?policy', title: 'Set bucket policy', status: '204 No Content',
        desc: 'Attach a JSON policy — e.g. allow anonymous read for a public web-asset bucket. Owner only.',
        request: `PUT /amity-web-public?policy
Content-Type: application/json

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::amity-web-public/*"]
    }
  ]
}`,
        response: `HTTP/1.1 204 No Content`,
        responseLang: 'http',
      },
      {
        id: 'put-cors', method: 'PUT', path: '/{bucket}?cors', title: 'Set CORS policy', status: '204 No Content',
        desc: 'Allow browser origins to call the bucket directly. Owner only.',
        request: `PUT /amity-my-app?cors
Content-Type: application/json

{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://*.amity.edu", "http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}`,
        response: `HTTP/1.1 204 No Content`,
        responseLang: 'http',
      },
      {
        id: 'issue-key', method: 'POST', path: '/{bucket}?keys', title: 'Issue a scoped access key', status: '201 Created',
        desc: 'Owner issues a key scoped to this bucket. The secret is returned once.',
        request: `POST /amity-my-app?keys
Content-Type: application/json

{ "label": "my-app-prod", "permissions": ["read", "write"] }`,
        response: `{
  "accessKeyId": "AMITY2A8C4VNB6RTY9KJ3",
  "secretAccessKey": "aB3dEfGhIjKlMnOpQrStUvWxYz0123456789LMSkey",
  "bucketScope": "amity-my-app",
  "permissions": ["read", "write"],
  "createdAt": "2026-07-01T09:05:00Z"
}`,
      },
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
          <div className="desc">Amity&#39;s S3-compatible REST API with JSON request/response samples for every operation. Use any S3 SDK or the Amity CLI.</div>
        </div>
        <Link to="/developers" className="btn"><BookOpen size={15} /> Integration Guide</Link>
      </div>

      <Card className="card-pad mb-4">
        <h3 className="mb-3">Base endpoint &amp; auth</h3>
        <p className="muted mb-3">Authenticate every request with <strong>S3 Signature V4</strong> using your Access Key ID and Secret. SDKs and the Amity CLI sign automatically. Responses are JSON; object bodies stream as bytes. Use path-style URLs.</p>
        <CodeBlock id="base" language="http" code={`Base URL:   ${ENDPOINT}
Auth:       S3 Signature Version 4 (header: Authorization)
Style:      Path-style  →  ${ENDPOINT}/{bucket}/{key}
Region:     on-prem-dc1 | on-prem-dc2
Accept:     application/json
TLS:        Required (HTTPS only)`} />
      </Card>

      {sections.map((sec) => (
        <div key={sec.title} className="mb-4">
          <h2 style={{ fontSize: 18, margin: '6px 2px 4px' }}>{sec.title}</h2>
          {sec.note && <div className="banner info mb-3"><span>{sec.note}</span></div>}
          {sec.ops.map((op) => <ApiOp key={op.id} op={op} />)}
        </div>
      ))}

      <div className="banner info"><span>Request/response semantics follow the standard S3 API. See the <Link to="/developers" style={{ color: 'var(--brand-2)' }}>Integration Guide</Link> for runnable code via the Amity CLI, Node.js, Python, Swift and Kotlin.</span></div>
    </>
  )
}

function ApiOp({ op }: { op: DetailedOp }) {
  return (
    <Card className="mb-3">
      <div className="card-pad">
        <div className="flex items-center gap-3 wrap" style={{ marginBottom: 6 }}>
          <Badge tone={methodTone[op.method] ?? 'gray'}>{op.method}</Badge>
          <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{op.path}</span>
          <span style={{ fontWeight: 600 }}>{op.title}</span>
        </div>
        <p className="muted text-sm mb-3">{op.desc}</p>
        {op.request && (
          <div className="mb-3">
            <div className="text-xs dim" style={{ letterSpacing: '0.06em', marginBottom: 6 }}>REQUEST</div>
            <CodeBlock id={`${op.id}-req`} language={op.requestLang ?? 'http'} code={op.request} />
          </div>
        )}
        <div>
          <div className="text-xs dim" style={{ letterSpacing: '0.06em', marginBottom: 6 }}>
            RESPONSE · <span style={{ color: op.status.startsWith('2') ? 'var(--green)' : 'var(--red)' }}>{op.status}</span>
          </div>
          <CodeBlock id={`${op.id}-res`} language={op.responseLang ?? 'json'} code={op.response} />
        </div>
      </div>
    </Card>
  )
}
