import { Holding } from './holding'
import { getMaintenanceState } from '@/lib/maintenance'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const { title, message } = await getMaintenanceState()
  return <Holding title={title} message={message} />
}
