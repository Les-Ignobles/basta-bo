import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useStatisticsStore } from '../stores/statistics-store'
import { generateOnboardingCSV, downloadCSV } from '../utils/csv-export'

export function CsvExportButton() {
  const data = useStatisticsStore((s) => s.data)

  const handleExport = () => {
    if (!data) return
    const csv = generateOnboardingCSV(data)
    const date = new Date().toISOString().split('T')[0]
    downloadCSV(csv, `statistiques-onboarding-${date}.csv`)
  }

  return (
    <Button onClick={handleExport} disabled={!data} variant="outline">
      <Download className="size-4 mr-2" />
      Exporter CSV
    </Button>
  )
}
