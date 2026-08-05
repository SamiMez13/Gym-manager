/**
 * FormBuilder — config-driven form renderer, inspired by Angular's FormBuilder.
 *
 * Usage:
 *   const fields: FieldConfig[] = [
 *     { name: "firstName", label: "First Name", type: "text", placeholder: "John" },
 *     { name: "role",      label: "Role",       type: "select", options: [{ label: "Admin", value: "admin" }] },
 *   ];
 *   <FormBuilder form={form} fields={fields} />
 *
 * Supported types: text | email | tel | number | textarea | select | datetime-local | switch
 */
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type SelectOption = { label: string; value: string };

export type FieldConfig<T extends FieldValues = FieldValues> = {
  name: Path<T>;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "datetime-local" | "switch";
  placeholder?: string;
  options?: SelectOption[];   // required for type === "select"
  step?: string;              // for type === "number"
  colSpan?: 1 | 2;           // within a 2-col grid; default 1
  optional?: boolean;        // appends "(optional)" to label
};

type FormBuilderProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  fields: FieldConfig<T>[];
  /** Total grid columns. Defaults to 2. */
  columns?: 1 | 2;
  className?: string;
};

export function FormBuilder<T extends FieldValues>({
  form,
  fields,
  columns = 2,
  className,
}: FormBuilderProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-4 pt-2",
        columns === 2 ? "grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {fields.map((f) => (
        <div
          key={String(f.name)}
          className={cn(
            f.colSpan === 2 || columns === 1 ? "col-span-2" : "col-span-1",
            f.type === "switch" && "flex items-center gap-3 py-2"
          )}
        >
          <FormField
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem className={f.type === "switch" ? "flex flex-row items-center gap-3 space-y-0" : undefined}>
                <FormLabel className="text-sm font-medium">
                  {f.label}
                  {f.optional && <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>}
                </FormLabel>

                {f.type === "select" && (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value != null ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={f.placeholder || `Select ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {f.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {f.type === "textarea" && (
                  <FormControl>
                    <Textarea
                      placeholder={f.placeholder}
                      {...field}
                      value={field.value ?? ""}
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                )}

                {f.type === "switch" && (
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                )}

                {["text", "email", "tel", "number", "datetime-local"].includes(f.type) && (
                  <FormControl>
                    <Input
                      type={f.type}
                      placeholder={f.placeholder}
                      step={f.step}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                )}

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Wrap FormBuilder in a <Form> and <form> tag.
 * Use this when the entire dialog content is the form.
 */
export function ManagedForm<T extends FieldValues>({
  form,
  fields,
  onSubmit,
  columns,
  footer,
  className,
}: FormBuilderProps<T> & {
  onSubmit: (values: T) => void;
  footer: React.ReactNode;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-2", className)}>
        <FormBuilder form={form} fields={fields} columns={columns} />
        <div className="pt-4">{footer}</div>
      </form>
    </Form>
  );
}
