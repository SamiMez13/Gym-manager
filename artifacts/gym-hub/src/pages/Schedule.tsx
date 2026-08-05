import { useState } from "react";
import {
  useListSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule,
  getListSchedulesQueryKey,
  useListClasses, useListTrainers, useListBranches,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Plus, Calendar, Edit2, Trash2, User, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const scheduleSchema = z.object({
  classId:   z.coerce.number().min(1, "Required"),
  trainerId: z.coerce.number().min(1, "Required"),
  branchId:  z.coerce.number().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  endTime:   z.string().min(1, "Required"),
  status:    z.string().default("scheduled"),
  notes:     z.string().optional(),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

const statusOptions = ["scheduled", "cancelled", "completed"].map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));

// ── Component ────────────────────────────────────────────────────────────────
export function Schedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number } & ScheduleForm | null>(null);

  const { data: schedules, isLoading } = useListSchedules();
  const { data: classes }  = useListClasses();
  const { data: trainers } = useListTrainers();
  const { data: branches } = useListBranches();

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  // Build dynamic field configs from loaded data
  const classOptions   = classes?.map(c => ({ label: c.name, value: String(c.id) })) ?? [];
  const trainerOptions = trainers?.map(t => ({ label: `${t.firstName} ${t.lastName}`, value: String(t.id) })) ?? [];
  const branchOptions  = branches?.map(b => ({ label: b.name, value: String(b.id) })) ?? [];

  const fields: FieldConfig<ScheduleForm>[] = [
    { name: "classId",   label: "Class",      type: "select", options: classOptions,   colSpan: 2 },
    { name: "trainerId", label: "Trainer",    type: "select", options: trainerOptions },
    { name: "branchId",  label: "Branch",     type: "select", options: branchOptions },
    { name: "startTime", label: "Start Time", type: "datetime-local" },
    { name: "endTime",   label: "End Time",   type: "datetime-local" },
    { name: "status",    label: "Status",     type: "select", options: statusOptions },
    { name: "notes",     label: "Notes",      type: "textarea", colSpan: 2, optional: true },
  ];

  const defaultValues: ScheduleForm = {
    classId: 0, trainerId: 0, branchId: 0, startTime: "", endTime: "", status: "scheduled", notes: "",
  };

  const addForm  = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema), defaultValues });
  const editForm = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema), defaultValues });

  function onAdd(values: ScheduleForm) {
    createSchedule.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Session scheduled" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function openEdit(s: NonNullable<typeof schedules>[number]) {
    const fmt = (dt: string) => dt ? dt.slice(0, 16) : ""; // "YYYY-MM-DDTHH:mm"
    const vals: ScheduleForm = {
      classId: s.classId, trainerId: s.trainerId, branchId: s.branchId,
      startTime: fmt(s.startTime), endTime: fmt(s.endTime),
      status: s.status, notes: (s as any).notes ?? "",
    };
    setEditTarget({ id: s.id, ...vals });
    editForm.reset(vals);
  }

  function onEdit(values: ScheduleForm) {
    if (!editTarget) return;
    updateSchedule.mutate({ id: editTarget.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Session updated" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
        setEditTarget(null);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Cancel this scheduled class?")) return;
    deleteSchedule.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Session cancelled" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      },
    });
  }

  // Group by day
  const grouped = schedules?.reduce((acc, s) => {
    const date = format(parseISO(s.startTime), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {} as Record<string, typeof schedules>) ?? {};
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage upcoming class sessions.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Class
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Schedule a Class</DialogTitle>
            <DialogDescription>Book a trainer and branch for a class session.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Scheduling…" : "Schedule"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the scheduled class details.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={editForm}
            fields={fields}
            onSubmit={onEdit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateSchedule.isPending}>
                  {updateSchedule.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Timeline */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p>No classes scheduled.</p>
          </div>
        ) : (
          sortedDates.map(date => {
            const daySchedules = [...(grouped[date] ?? [])].sort(
              (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
            return (
              <div key={date} className="space-y-4">
                <h3 className="font-bold tracking-tight text-lg flex items-center gap-2 pb-2 border-b">
                  <Calendar className="w-5 h-5 text-primary" />
                  {format(parseISO(date), "EEEE, MMMM do, yyyy")}
                </h3>
                <div className="grid gap-3">
                  {daySchedules.map(schedule => {
                    const start  = parseISO(schedule.startTime);
                    const end    = parseISO(schedule.endTime);
                    const isFull = schedule.currentBookings >= (schedule.maxCapacity || 999);
                    return (
                      <Card key={schedule.id} className="overflow-hidden border-l-4 border-l-primary hover:border-l-primary/80 transition-colors">
                        <CardContent className="p-0 flex items-stretch">
                          <div className="w-32 bg-muted/30 flex flex-col items-center justify-center p-4 border-r border-border/50">
                            <span className="font-bold text-lg">{format(start, "h:mm a")}</span>
                            <span className="text-xs text-muted-foreground">{format(end, "h:mm a")}</span>
                          </div>
                          <div className="flex-1 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{schedule.className}</h4>
                                {schedule.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
                                {isFull && <Badge variant="secondary" className="bg-orange-100 text-orange-800">Full</Badge>}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {schedule.trainerName}</span>
                                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {schedule.branchName}</span>
                                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {schedule.currentBookings} / {schedule.maxCapacity} booked</span>
                              </div>
                            </div>
                            <div className="flex gap-1 self-start md:self-auto">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(schedule)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(schedule.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
