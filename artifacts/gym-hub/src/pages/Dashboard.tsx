import { useGetDashboardStats, useGetDashboardRecentActivity, useGetDashboardClassUtilization, useGetDashboardRevenueSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, CalendarDays, DollarSign, Building2, Medal, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardRecentActivity();
  const { data: utilization, isLoading: utilLoading } = useGetDashboardClassUtilization();
  const { data: revenue, isLoading: revLoading } = useGetDashboardRevenueSummary();

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your gym's performance and activity today.</p>
        </div>
        <div className="flex items-center text-sm font-medium text-muted-foreground bg-white px-4 py-2 rounded-md shadow-sm border">
          <CalendarDays className="w-4 h-4 mr-2" />
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </div>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : stats ? (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVars}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.revenueThisMonth.toLocaleString()} this month
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVars}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {stats.totalMembers} total members
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVars}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
                <Dumbbell className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledClassesToday}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.bookingsToday} total bookings today
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVars}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
                <Medal className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMemberships || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {stats.totalBranches || 1} branches
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue totals for the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {revLoading ? (
              <Skeleton className="w-full h-full" />
            ) : revenue && revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Class Utilization</CardTitle>
            <CardDescription>Average capacity filled per class type</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {utilLoading ? (
              <Skeleton className="w-full h-full" />
            ) : utilization && utilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={utilization} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="className" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    formatter={(value: number) => [`${value}%`, 'Utilization']}
                  />
                  <Line type="monotone" dataKey="avgUtilizationPercent" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No utilization data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  key={item.id} 
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM d, h:mm a")} • {item.type}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No recent activity recorded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
