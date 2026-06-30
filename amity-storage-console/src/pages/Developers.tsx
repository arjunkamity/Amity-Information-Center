import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket, Database, KeyRound, Shield, Globe2, ArrowDownToLine, ArrowUpFromLine,
  List, Trash2, Link2, Layers, Monitor, FileCode2, Smartphone, Lock, BookOpen,
} from 'lucide-react'
import { Card, Badge } from '../components/ui'
import { CodeBlock, CodeTabs } from '../components/Code'

const ENDPOINT = 'https://s3.amity.internal'

const toc = [
  { id: 'overview', label: 'Overview', icon: Rocket },
  { id: 'create-bucket', label: '1. Create a bucket', icon: Database },
  { id: 'keys', label: '2. Get access keys', icon: KeyRound },
  { id: 'policies', label: '3. Bucket policies', icon: Shield },
  { id: 'cors', label: '4. Configure CORS', icon: Globe2 },
  { id: 'operations', label: '5. Object operations', icon: Layers },
  { id: 'web', label: 'Implement: Web apps', icon: Monitor },
  { id: 'landing', label: 'Implement: Landing pages', icon: FileCode2 },
  { id: 'mobile', label: 'Implement: Mobile apps', icon: Smartphone },
  { id: 'security', label: 'Security best practices', icon: Lock },
]

export default function Developers() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Developer Integration Guide</h1>
          <div className="desc">End-to-end flow for integrating the Amity S3-compatible storage platform into your web apps, landing pages, and mobile apps — from bucket creation to object operations.</div>
        </div>
        <Link to="/developers/api" className="btn"><BookOpen size={15} /> API Reference</Link>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sticky TOC */}
        <nav className="doc-toc" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
          <div className="nav-section-label" style={{ paddingLeft: 10 }}>On this page</div>
          {toc.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="nav-link">
              <t.icon size={15} /> {t.label}
            </a>
          ))}
          <div className="banner mt-3" style={{ display: 'block', fontSize: 11.5 }}>
            <div className="dim mb-3">Endpoint</div>
            <code className="mono" style={{ color: 'var(--accent)' }}>{ENDPOINT}</code>
          </div>
        </nav>

        {/* Content */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <Section id="overview" icon={<Rocket size={18} />} title="Overview">
            <p className="muted">
              Amity Storage is Amity&#39;s own managed, on-prem object storage. It speaks the standard
              <strong> S3 API</strong>, so any S3-compatible SDK or tool works — just point it at the Amity endpoint.
              The typical integration is four steps:
            </p>
            <div className="grid grid-4 mt-3 mb-3">
              <Flow n={1} icon={<Database size={16} />} label="Create bucket" />
              <Flow n={2} icon={<KeyRound size={16} />} label="Get keys" />
              <Flow n={3} icon={<Shield size={16} />} label="Set policy + CORS" />
              <Flow n={4} icon={<Layers size={16} />} label="Read / write objects" />
            </div>
            <div className="banner warn mb-3"><Lock size={15} /> <span>Only a bucket&#39;s <strong>owner</strong> can administer it — create/revoke keys, set policies &amp; CORS, map domains, or delete it. Other roles get read/write per the bucket&#39;s RBAC policy.</span></div>
            <p className="muted">Install the Amity CLI, or any S3-compatible SDK for your stack:</p>
            <CodeTabs
              id="install"
              tabs={[
                { label: 'Amity CLI', language: 'bash', code: `npm install -g @amity/storage-cli\n\namity login --endpoint ${ENDPOINT}   # authenticate once` },
                { label: 'Node.js', language: 'bash', code: 'npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner\n# (the standard S3 v3 client — works against the Amity endpoint)' },
                { label: 'Python', language: 'bash', code: 'pip install boto3   # the standard S3 client library' },
                { label: 'MinIO mc', language: 'bash', code: `mc alias set amity ${ENDPOINT} <ACCESS_KEY> <SECRET_KEY>` },
              ]}
            />
          </Section>

          <Section id="create-bucket" icon={<Database size={18} />} title="1. Create a bucket">
            <p className="muted">Provision a bucket from the console (fastest) or via the API/CLI. Each bucket is governed by a category that applies retention and naming rules.</p>
            <div className="banner info mb-3"><span>Console: <Link to="/buckets" style={{ color: 'var(--brand-2)' }}>Buckets → Provision bucket</Link>. A bucket and scoped keys are ready in &lt; 1 minute (FR-001). The creator becomes the bucket <strong>owner</strong> and its sole administrator.</span></div>
            <CodeTabs
              id="create"
              tabs={[
                { label: 'Amity CLI', language: 'bash', code: `amity bucket create amity-my-app --region on-prem-dc1` },
                { label: 'Node.js', language: 'javascript', code: `import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";\n\n// Standard S3 client, pointed at the Amity endpoint\nconst s3 = new S3Client({\n  endpoint: "${ENDPOINT}",\n  region: "on-prem-dc1",\n  forcePathStyle: true,\n  credentials: { accessKeyId: "AMITY...", secretAccessKey: "..." },\n});\n\nawait s3.send(new CreateBucketCommand({ Bucket: "amity-my-app" }));` },
                { label: 'Python', language: 'python', code: `import boto3\n\ns3 = boto3.client("s3", endpoint_url="${ENDPOINT}",\n    region_name="on-prem-dc1",\n    aws_access_key_id="AMITY...", aws_secret_access_key="...")\n\ns3.create_bucket(Bucket="amity-my-app")` },
                { label: 'MinIO mc', language: 'bash', code: `mc mb amity/amity-my-app` },
              ]}
            />
            <p className="muted mt-3"><strong>Naming:</strong> lowercase letters, numbers and hyphens; 3–41 chars; prefix with your team/app (e.g. <code className="mono">amity-web-public</code>).</p>
          </Section>

          <Section id="keys" icon={<KeyRound size={18} />} title="2. Get access keys">
            <p className="muted">The bucket owner issues scoped access keys. Each key has an <strong>Access Key ID</strong> and a <strong>Secret Access Key</strong> (shown once). Scope keys to a single bucket and the minimum permissions your app needs.</p>
            <div className="banner info mb-3"><span>Console: the owner opens the bucket → <strong>Settings → Access credentials → Generate key</strong>, or manages all keys under <Link to="/access" style={{ color: 'var(--brand-2)' }}>Access &amp; Keys</Link>.</span></div>
            <CodeBlock id="key-cli" language="bash" title="Amity CLI" code={`amity key create --bucket amity-my-app --permissions read,write --label my-app-prod`} />
            <p className="muted">Store credentials in environment variables — never commit them or ship the secret in client-side code:</p>
            <CodeBlock id="env" language="bash" title=".env" code={`AMITY_S3_ENDPOINT=${ENDPOINT}\nAMITY_S3_REGION=on-prem-dc1\nAMITY_ACCESS_KEY_ID=AMITY7F3K9QX2LMP0WD1\nAMITY_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`} />
          </Section>

          <Section id="policies" icon={<Shield size={18} />} title="3. Bucket policies">
            <p className="muted">
              Policies control who can do what. The platform enforces <strong>RBAC</strong> (roles → bucket permissions, managed under <Link to="/policies" style={{ color: 'var(--brand-2)' }}>Policies</Link>) on every request, and <strong>only the bucket owner</strong> can change a bucket&#39;s policy or CORS. For website/CDN assets the owner can additionally attach a JSON bucket policy that allows anonymous <code className="mono">GetObject</code> (public read).
            </p>
            <p className="muted"><strong>Public read</strong> (use only for non-sensitive web assets):</p>
            <CodeBlock id="pol-public" language="json" title="public-read-policy.json" code={`{
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
}`} />
            <p className="muted mt-3">Apply it:</p>
            <CodeTabs
              id="apply-policy"
              tabs={[
                { label: 'Amity CLI', language: 'bash', code: `amity bucket policy set amity-web-public ./public-read-policy.json` },
                { label: 'Node.js', language: 'javascript', code: `import { PutBucketPolicyCommand } from "@aws-sdk/client-s3";\n\nawait s3.send(new PutBucketPolicyCommand({\n  Bucket: "amity-web-public",\n  Policy: JSON.stringify(policy),\n}));` },
                { label: 'MinIO mc', language: 'bash', code: `mc anonymous set download amity/amity-web-public   # public read` },
              ]}
            />
            <div className="banner warn mt-3"><span>Private buckets (records, app data) should have <strong>no public policy</strong> — serve them through presigned URLs instead (see §5).</span></div>
          </Section>

          <Section id="cors" icon={<Globe2 size={18} />} title="4. Configure CORS">
            <p className="muted">Browsers block cross-origin requests unless the bucket returns CORS headers. Add your app's origins so a web app or landing page can <code className="mono">PUT</code>/<code className="mono">GET</code> directly from the browser.</p>
            <CodeBlock id="cors-json" language="json" title="cors.json" code={`{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://app.amity.edu",
        "https://*.amity.edu",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}`} />
            <p className="muted mt-3">Apply it (owner only):</p>
            <CodeBlock id="cors-apply" language="bash" title="Amity CLI" code={`amity bucket cors set amity-my-app ./cors.json`} />
          </Section>

          <Section id="operations" icon={<Layers size={18} />} title="5. Object operations">
            <p className="muted">The core verbs. Examples assume a configured <code className="mono">s3</code> client (see §1).</p>

            <OpHead icon={<ArrowUpFromLine size={15} />} verb="PUT" tone="blue" desc="Upload / create an object" />
            <CodeTabs
              id="put"
              tabs={[
                { label: 'Node.js', language: 'javascript', code: `import { PutObjectCommand } from "@aws-sdk/client-s3";\nimport { readFile } from "node:fs/promises";\n\nawait s3.send(new PutObjectCommand({\n  Bucket: "amity-my-app",\n  Key: "uploads/avatar.png",\n  Body: await readFile("avatar.png"),\n  ContentType: "image/png",\n}));` },
                { label: 'Python', language: 'python', code: `s3.upload_file("avatar.png", "amity-my-app", "uploads/avatar.png",\n    ExtraArgs={"ContentType": "image/png"})` },
                { label: 'Amity CLI', language: 'bash', code: `amity object put amity-my-app uploads/avatar.png ./avatar.png` },
                { label: 'cURL', language: 'bash', code: `curl -X PUT "${ENDPOINT}/amity-my-app/uploads/avatar.png" \\\n  --upload-file avatar.png \\\n  -H "Content-Type: image/png"   # + S3 Signature V4 auth` },
              ]}
            />

            <OpHead icon={<ArrowDownToLine size={15} />} verb="GET" tone="green" desc="Download / read an object" />
            <CodeTabs
              id="get"
              tabs={[
                { label: 'Node.js', language: 'javascript', code: `import { GetObjectCommand } from "@aws-sdk/client-s3";\n\nconst res = await s3.send(new GetObjectCommand({\n  Bucket: "amity-my-app",\n  Key: "uploads/avatar.png",\n}));\nconst bytes = await res.Body.transformToByteArray();` },
                { label: 'Python', language: 'python', code: `s3.download_file("amity-my-app", "uploads/avatar.png", "avatar.png")` },
                { label: 'Amity CLI', language: 'bash', code: `amity object get amity-my-app uploads/avatar.png ./avatar.png` },
                { label: 'cURL', language: 'bash', code: `curl "${ENDPOINT}/amity-my-app/uploads/avatar.png" -o avatar.png` },
              ]}
            />

            <OpHead icon={<List size={15} />} verb="LIST" tone="amber" desc="List objects (with prefix)" />
            <CodeTabs
              id="list"
              tabs={[
                { label: 'Node.js', language: 'javascript', code: `import { ListObjectsV2Command } from "@aws-sdk/client-s3";\n\nconst res = await s3.send(new ListObjectsV2Command({\n  Bucket: "amity-my-app",\n  Prefix: "uploads/",\n  MaxKeys: 100,\n}));\nres.Contents?.forEach(o => console.log(o.Key, o.Size));` },
                { label: 'Python', language: 'python', code: `for obj in s3.list_objects_v2(Bucket="amity-my-app", Prefix="uploads/").get("Contents", []):\n    print(obj["Key"], obj["Size"])` },
                { label: 'Amity CLI', language: 'bash', code: `amity object list amity-my-app --prefix uploads/` },
              ]}
            />

            <OpHead icon={<Trash2 size={15} />} verb="DELETE" tone="red" desc="Delete an object" />
            <CodeTabs
              id="delete"
              tabs={[
                { label: 'Node.js', language: 'javascript', code: `import { DeleteObjectCommand } from "@aws-sdk/client-s3";\n\nawait s3.send(new DeleteObjectCommand({\n  Bucket: "amity-my-app",\n  Key: "uploads/avatar.png",\n}));` },
                { label: 'Python', language: 'python', code: `s3.delete_object(Bucket="amity-my-app", Key="uploads/avatar.png")` },
                { label: 'Amity CLI', language: 'bash', code: `amity object delete amity-my-app uploads/avatar.png` },
              ]}
            />

            <OpHead icon={<Link2 size={15} />} verb="PRESIGNED URL" tone="purple" desc="Time-limited link — upload/download without exposing keys" />
            <CodeTabs
              id="presign"
              tabs={[
                { label: 'Node.js', language: 'javascript', code: `import { getSignedUrl } from "@aws-sdk/s3-request-presigner";\nimport { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";\n\n// Upload URL (PUT) — valid 5 minutes\nconst uploadUrl = await getSignedUrl(s3,\n  new PutObjectCommand({ Bucket: "amity-my-app", Key: "uploads/photo.jpg" }),\n  { expiresIn: 300 });\n\n// Download URL (GET)\nconst downloadUrl = await getSignedUrl(s3,\n  new GetObjectCommand({ Bucket: "amity-my-app", Key: "uploads/photo.jpg" }),\n  { expiresIn: 300 });` },
                { label: 'Python', language: 'python', code: `upload_url = s3.generate_presigned_url("put_object",\n    Params={"Bucket": "amity-my-app", "Key": "uploads/photo.jpg"},\n    ExpiresIn=300)\n\ndownload_url = s3.generate_presigned_url("get_object",\n    Params={"Bucket": "amity-my-app", "Key": "uploads/photo.jpg"},\n    ExpiresIn=300)` },
              ]}
            />
            <div className="banner info mt-3"><span>Presigned URLs are the recommended pattern for browsers and mobile: your backend signs the URL, the client uploads directly to storage — keys never leave the server.</span></div>
          </Section>

          <Section id="web" icon={<Monitor size={18} />} title="Implement in web apps">
            <p className="muted">A React/SPA app should <strong>never embed the secret key</strong>. Use the presigned-URL pattern: a small backend route signs URLs, the browser uploads directly.</p>
            <p className="muted"><strong>Backend</strong> (Node/Express) — issue a presigned upload URL:</p>
            <CodeBlock id="web-be" language="javascript" title="server.js" code={`app.post("/api/upload-url", async (req, res) => {
  const key = "uploads/" + crypto.randomUUID() + "-" + req.body.filename;
  const url = await getSignedUrl(s3,
    new PutObjectCommand({ Bucket: "amity-my-app", Key: key,
      ContentType: req.body.contentType }),
    { expiresIn: 300 });
  res.json({ url, key });
});`} />
            <p className="muted mt-3"><strong>Frontend</strong> (React) — upload the file straight to storage:</p>
            <CodeBlock id="web-fe" language="typescript" title="upload.ts" code={`async function uploadFile(file: File) {
  // 1. ask backend to sign a URL
  const { url, key } = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  }).then(r => r.json());

  // 2. PUT the file directly to Amity Storage (needs CORS, §4)
  await fetch(url, { method: "PUT", body: file,
    headers: { "Content-Type": file.type } });

  return key; // store this reference in your DB
}`} />
          </Section>

          <Section id="landing" icon={<FileCode2 size={18} />} title="Implement in landing pages">
            <p className="muted">Static landing &amp; promotional pages mostly <strong>read</strong> public assets. Serve them via the bucket's custom domain (CDN) for clean URLs and caching — no SDK or keys needed.</p>
            <p className="muted">With a custom domain mapped (bucket → <strong>Settings → Custom domains</strong>, e.g. <code className="mono">cdn.amity.edu</code>):</p>
            <CodeBlock id="landing-html" language="xml" title="index.html" code={`<!-- Served from the public bucket via its custom domain -->
<img src="https://cdn.amity.edu/web/home/2026/hero-banner.webp"
     alt="Campus" loading="lazy" />

<link rel="stylesheet" href="https://cdn.amity.edu/web/css/landing.css" />
<video src="https://cdn.amity.edu/mkt/spring-intake/reel-01.mp4"
       autoplay muted loop></video>`} />
            <p className="muted mt-3">Or the raw S3 path if no custom domain is set:</p>
            <CodeBlock id="landing-raw" language="xml" code={`<img src="${ENDPOINT}/amity-web-public/web/home/2026/hero-banner.webp" />`} />
            <div className="banner info mt-3"><span>For a "submit your details" form on a landing page that uploads a file, use the same presigned-URL pattern as web apps (§Web apps) so you don't ship keys in static HTML.</span></div>
          </Section>

          <Section id="mobile" icon={<Smartphone size={18} />} title="Implement in mobile apps">
            <p className="muted">Mobile apps follow the same rule: <strong>no secret keys in the app binary</strong>. Your backend signs URLs; the app uploads/downloads directly over HTTPS.</p>
            <CodeTabs
              id="mobile"
              tabs={[
                { label: 'Swift (iOS)', language: 'swift', code: `// 1. Get a presigned PUT URL from your backend\nlet (data, _) = try await URLSession.shared.data(from: signEndpoint)\nlet signed = try JSONDecoder().decode(SignedUpload.self, from: data)\n\n// 2. Upload the file directly to Amity Storage\nvar req = URLRequest(url: URL(string: signed.url)!)\nreq.httpMethod = "PUT"\nreq.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")\n_ = try await URLSession.shared.upload(for: req, from: imageData)` },
                { label: 'Kotlin (Android)', language: 'kotlin', code: `// 1. Get presigned URL from backend (Retrofit/Ktor)\nval signed = api.getUploadUrl(filename, contentType)\n\n// 2. PUT the bytes directly (OkHttp)\nval body = imageBytes.toRequestBody("image/jpeg".toMediaType())\nval request = Request.Builder()\n    .url(signed.url)\n    .put(body)\n    .header("Content-Type", "image/jpeg")\n    .build()\nclient.newCall(request).execute()` },
                { label: 'React Native', language: 'javascript', code: `const { url, key } = await api.getUploadUrl(file.name, file.type);\nawait fetch(url, {\n  method: "PUT",\n  body: { uri: file.uri, type: file.type, name: file.name },\n  headers: { "Content-Type": file.type },\n});` },
              ]}
            />
            <div className="banner info mt-3"><span>For displaying private images in-app, request a presigned <strong>GET</strong> URL and load it in your image view; it expires automatically.</span></div>
          </Section>

          <Section id="security" icon={<Lock size={18} />} title="Security best practices">
            <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
              <li><strong>Administration is owner-only:</strong> only the bucket owner can issue/revoke keys, change policies &amp; CORS, map domains, or delete the bucket. Transfer ownership before off-boarding.</li>
              <li>Never ship the <strong>secret key</strong> in browser JS, static HTML, or a mobile binary — sign URLs server-side.</li>
              <li>Scope each key to <strong>one bucket</strong> with the <strong>least permissions</strong> required (read-only where possible).</li>
              <li>Keep <strong>presigned URL expiry short</strong> (1–5 minutes for uploads).</li>
              <li>Make buckets <strong>public-read only</strong> for genuinely public web assets; everything else stays private + presigned.</li>
              <li>Restrict <strong>CORS origins</strong> to your real domains — avoid <code className="mono">"*"</code> in production.</li>
              <li>Rotate keys periodically and <strong>revoke</strong> unused ones under <Link to="/access" style={{ color: 'var(--brand-2)' }}>Access &amp; Keys</Link>.</li>
              <li>All requests are TLS-encrypted and written to the <Link to="/audit" style={{ color: 'var(--brand-2)' }}>Audit Log</Link>.</li>
            </ul>
          </Section>

          <div className="flex gap-2 wrap">
            <Link to="/buckets" className="btn primary"><Database size={15} /> Create your first bucket</Link>
            <Link to="/developers/api" className="btn"><BookOpen size={15} /> Full API Reference</Link>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ id, icon, title, children }: { id: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="card-pad" >
      <div id={id} style={{ scrollMarginTop: 'calc(var(--topbar-h) + 20px)' }}>
        <h2 className="flex items-center gap-2" style={{ fontSize: 18, marginBottom: 14 }}>
          <span className="icon-circle" style={{ width: 34, height: 34, background: 'var(--brand-soft)', color: 'var(--brand-2)' }}>{icon}</span>
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
      </div>
    </Card>
  )
}

function Flow({ n, icon, label }: { n: number; icon: ReactNode; label: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
      <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
        <Badge tone="brand">{n}</Badge>
        <span style={{ color: 'var(--brand-2)' }}>{icon}</span>
      </div>
      <div className="text-sm mt-2" style={{ fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function OpHead({ icon, verb, desc, tone }: { icon: ReactNode; verb: string; desc: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  return (
    <div className="flex items-center gap-3 mt-3" style={{ marginBottom: 2 }}>
      <Badge tone={tone} dot>{icon} {verb}</Badge>
      <span className="muted text-sm">{desc}</span>
    </div>
  )
}
