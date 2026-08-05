import { useState } from "react";
import {
  useListBookings, useCreateBooking, useUpdateBooking, useDeleteBooking,
  getListBookingsQueryKey,
  useListMembers, useListSchedules,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Plus, Search, CheckCircle, XCircle, Clock, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const bookingSchema = z.object({
  memberId:   z.coerce.number().min(1, "Member required"),
  scheduleId: z.coerce.number().min(1, "Class session required"),
  status:     z.string().default("confirmed"),
});
type BookingForm = z.infer<typeof bookingSchema>;

const statusOptions = ["confirmed", "attended", "no-show", "cancelled"].map(v => ({
  label: v.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()),
  value: v,
}));

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "confirmed": return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</Badge>;
    case "cancelled": return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
    case "attended":  return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"><CheckCircle className="w-3 h-3 mr-1" /> Attended</Badge>;
    case "no-show":   return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" /> No-Show</Badge>;
    default:          return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
  }
};

// ── Component ────────────────────────────────────────────────────────────────
export function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: bookings, isLoading } = useListBookings();
  const { data: members }   = useListMembers();
  const { data: schedules } = useListSchedules();

  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const memberOptions   = members?.map(m => ({ label: `${m.firstName} ${m.lastName}`, value: String(m.id) })) ?? [];
  const scheduleOptions = schedules?.map(s => ({
    label: `${s.className} — ${format(parseISO(s.startTime), "MMM d, h:mm a")}`,
    value: String(s.id),
  })) ?? [];

  const fields: FieldConfig<BookingForm>[] = [
    { name: "memberId",   label: "Member",        type: "select", options: memberOptions,   colSpan: 2 },
    { name: "scheduleId", label: "Class Session",  type: "select", options: scheduleOptions, colSpan: 2 },
    { name: "status",     label: "Status",         type: "select", options: statusOptions },
  ];

  const defaultValues: BookingForm = { memberId: 0, scheduleId: 0, status: "confirmed" };
  const addForm = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), defaultValues });

  function onAdd(values: BookingForm) {
    createBooking.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Booking created" });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleUpdateStatus(id: number, status: string) {
    updateBooking.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Booking marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this booking record?")) return;
    deleteBooking.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Booking deleted" });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
    });
  }

  const filteredBookings = bookings?.filter(b =>
    `${b.memberName || ""} ${b.className || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">View and manage member class reservations.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>Reserve a spot for a member in a class session.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            columns={1}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createBooking.isPending}>
                  {createBooking.isPending ? "Booking…" : "Create Booking"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by member or class name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked On</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[80, 150, 120, 100, 100, 32].map((w, j) => (
                      <TableCell key={j}><Skeleton className={`h-6 w-[${w}px]`} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredBookings?.length === 0
              ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No bookings found.</TableCell></TableRow>
              : filteredBookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{booking.id.toString().padStart(5, "0")}
                    </TableCell>
                    <TableCell className="font-medium">{booking.memberName}</TableCell>
                    <TableCell>{booking.className}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(booking.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "confirmed")}>Mark Confirmed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "attended")}>Mark Attended</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "no-show")}>Mark No-Show</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, "cancelled")}>Mark Cancelled</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(booking.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
