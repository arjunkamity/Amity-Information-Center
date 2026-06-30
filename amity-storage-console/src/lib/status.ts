import type { Tone } from '../components/ui'
import type {
  BucketStatus, EnrichmentStatus, JobState, Visibility, AuditLog,
} from '../data/types'

export const bucketStatusTone: Record<BucketStatus, Tone> = {
  active: 'green', provisioning: 'blue', archived: 'gray', error: 'red',
}

export const enrichmentTone: Record<EnrichmentStatus, Tone> = {
  searchable: 'green', processing: 'blue', queued: 'amber', failed: 'red', duplicate: 'purple',
}

export const jobStateTone: Record<JobState, Tone> = {
  running: 'blue', queued: 'amber', completed: 'green', failed: 'red', 'dead-letter': 'purple',
}

export const visibilityTone: Record<Visibility, Tone> = {
  public: 'blue', internal: 'amber', private: 'gray',
}

export const auditResultTone: Record<AuditLog['result'], Tone> = {
  success: 'green', denied: 'amber', error: 'red',
}
