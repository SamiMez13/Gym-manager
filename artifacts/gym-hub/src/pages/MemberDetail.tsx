import { useParams, Link } from "wouter";
import { useGetMember, useListMemberships, useListBookings } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Activity, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MemberDetail() {
  const { id } = useParams();
  const memberId = Number(id);
  
  const { data: member, isLoading: memberLoading } = useGetMember(memberId, { query: { enabled: !!memberId } });
  const { data: memberships, isLoading: membershipsLoading } = useListMemberships();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();

  const memberMemberships = memberships?.filter(m => m.memberId === memberId);
  const memberBookings = bookings?.filter(b => b.memberId === memberId);

  if (memberLoading) {
    return <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>;
  }

  if (!member) {
    return <div>Member not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/members"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{member.firstName} {member.lastName}</h1>
          <p className="text-muted-foreground mt-1">Member Profile & History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-1 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl border-2 border-primary/20">
                {member.firstName[0]}{member.lastName[0]}
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground text-sm flex items-center"><Mail className="w-4 h-4 mr-2"/> Email</span>
              <span className="font-medium text-sm">{member.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground text-sm flex items-center"><Phone className="w-4 h-4 mr-2"/> Phone</span>
              <span className="font-medium text-sm">{member.phone}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground text-sm flex items-center"><Calendar className="w-4 h-4 mr-2"/> Joined</span>
              <span className="font-medium text-sm">{format(new Date(member.joinedAt || member.createdAt), "MMM d, yyyy")}</span>
            </div>
            {member.address && (
              <div className="flex flex-col py-2 border-b">
                <span className="text-muted-foreground text-sm flex items-center mb-1"><MapPin className="w-4 h-4 mr-2"/> Address</span>
                <span className="font-medium text-sm pl-6">{member.address}</span>
              </div>
            )}
            <div className="pt-4 flex justify-center">
              <Badge variant={member.isActive ? "default" : "destructive"} className="text-sm px-4 py-1">
                {member.isActive ? "Active Member" : "Inactive Account"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Active Memberships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg"><CreditCard className="w-5 h-5 mr-2 text-primary" /> Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              {membershipsLoading ? <Skeleton className="h-20" /> : 
               memberMemberships?.length === 0 ? <p className="text-sm text-muted-foreground">No memberships found.</p> : (
                 <div className="space-y-3">
                   {memberMemberships?.map(m => (
                     <div key={m.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                       <div>
                         <p className="font-bold">{m.planName}</p>
                         <p className="text-xs text-muted-foreground">{format(parseISO(m.startDate), "MMM d, yyyy")} - {format(parseISO(m.endDate), "MMM d, yyyy")}</p>
                       </div>
                       <Badge variant="outline" className={m.status === 'Active' ? 'bg-green-50 text-green-700' : ''}>
                         {m.status}
                       </Badge>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg"><Activity className="w-5 h-5 mr-2 text-primary" /> Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? <Skeleton className="h-32" /> : 
               memberBookings?.length === 0 ? <p className="text-sm text-muted-foreground">No class bookings found.</p> : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Class</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead>Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {memberBookings?.map(b => (
                       <TableRow key={b.id}>
                         <TableCell className="font-medium">{b.className}</TableCell>
                         <TableCell className="text-sm text-muted-foreground">{format(parseISO(b.createdAt), "MMM d, yyyy")}</TableCell>
                         <TableCell>
                           <Badge variant="secondary" className="text-xs">{b.status}</Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
