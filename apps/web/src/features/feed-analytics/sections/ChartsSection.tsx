import { GroupActivityChart } from '../components/GroupActivityChart'
import { TimelineChart } from '../components/TimelineChart'
import { PostsDistributionPie } from '../components/PostsDistributionPie'

interface DerivedGroupStat {
  name: string; fullName: string
  posts: number; likes: number; comments: number; members: number
}
interface TimelinePoint { date: string; count: number }

interface ChartsSectionProps {
  groupStats:   DerivedGroupStat[]
  timelineData: TimelinePoint[]
}

export function ChartsSection({ groupStats, timelineData }: ChartsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <GroupActivityChart data={groupStats} />
        <TimelineChart data={timelineData} />
      </div>
    </>
  )
}
