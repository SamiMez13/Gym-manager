import { useState } from "react";
import {
  useListClasses, useCreateClass, useUpdateClass, useDeleteClass,
  getListClassesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Clock, Users, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const classSchema = z.object({
  name:            z.string().min(2, "Required"),
  category:        z.string().min(2, "Required"),
  description:     z.string().optional(),
  durationMinutes: z.coerce.number().min(15, "Min 15 min").max(240, "Max 240 min"),
  maxCapacity:     z.coerce.number().min(1, "Min 1"),
  difficultyLevel: z.string().optional(),
  isActive:        z.boolean().default(true),
});
type ClassForm = z.infer<typeof classSchema>;

const categoryOptions = ["Yoga", "HIIT", "Strength", "Cardio", "Pilates", "CrossFit", "Boxing", "Other"].map(v => ({ label: v, value: v }));
const difficultyOptions = ["Beginner", "Intermediate", "Advanced", "All Levels"].map(v => ({ label: v, value: v }));

const fields: FieldConfig<ClassForm>[] = [
  { name: "name",            label: "Class Name",      type: "text",   placeholder: "Power Yoga" },
  { name: "category",        label: "Category",         type: "select", options: categoryOptions },
  { name: "durationMinutes", label: "Duration (min)",   type: "number", placeholder: "60" },
  { name: "maxCapacity",     label: "Max Capacity",     type: "number", placeholder: "20" },
  { name: "difficultyLevel", label: "Difficulty",       type: "select", options: difficultyOptions, optional: true },
  { name: "isActive",        label: "Active",           type: "switch" },
  { name: "description",     label: "Description",      type: "textarea", colSpan: 2, optional: true },
];

const categoryColors: Record<string, string> = {
  "Yoga":     "bg-indigo-100 text-indigo-700 border-indigo-200",
  "HIIT":     "bg-red-100 text-red-700 border-red-200",
  "Strength": "bg-amber-100 text-amber-700 border-amber-200",
  "Cardio":   "bg-blue-100 text-blue-700 border-blue-200",
  "Pilates":  "bg-purple-100 text-purple-700 border-purple-200",
  "CrossFit": "bg-orange-100 text-orange-700 border-orange-200",
  "Boxing":   "bg-gray-100 text-gray-700 border-gray-200",
};

// ── Component ────────────────────────────────────────────────────────────────
export function Classes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number } & ClassForm | null>(null);

  const { data: classes, isLoading } = useListClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const defaultValues: ClassForm = {
    name: "", category: "", description: "", durationMinutes: 60,
    maxCapacity: 20, difficultyLevel: "All Levels", isActive: true,
  };

  const addForm  = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues });
  const editForm = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues });

  function onAdd(values: ClassForm) {
    createClass.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Class created" });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function openEdit(c: NonNullable<typeof classes>[number]) {
    const vals: ClassForm = {
      name: c.name, category: c.category, description: c.description ?? "",
      durationMinutes: c.durationMinutes, maxCapacity: c.maxCapacity,
      difficultyLevel: c.difficultyLevel ?? "All Levels", isActive: c.isActive ?? true,
    };
    setEditTarget({ id: c.id, ...vals });
    editForm.reset(vals);
  }

  function onEdit(values: ClassForm) {
    if (!editTarget) return;
    updateClass.mutate({ id: editTarget.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Class updated" });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        setEditTarget(null);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this class template?")) return;
    deleteClass.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Class deleted" });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage the types of classes offered.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Class Type
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Class Type</DialogTitle>
            <DialogDescription>Define a new class template for the schedule.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createClass.isPending}>
                  {createClass.isPending ? "Saving…" : "Create Class"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class details.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={editForm}
            fields={fields}
            onSubmit={onEdit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateClass.isPending}>
                  {updateClass.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
          : classes?.map((c) => (
              <Card key={c.id} className="flex flex-col group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className={categoryColors[c.category] || ""}>{c.category}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-2">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description || "No description provided."}</p>
                </CardContent>
                <CardFooter className="pt-0 flex gap-4 text-xs font-medium text-muted-foreground border-t mt-4 p-4 bg-muted/20">
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.durationMinutes} min</div>
                  <div className="flex items-center gap-1"><Users className="w-3 h-3" /> max {c.maxCapacity}</div>
                  <div className="flex items-center gap-1 ml-auto"><Flame className="w-3 h-3" /> {c.difficultyLevel}</div>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
}
