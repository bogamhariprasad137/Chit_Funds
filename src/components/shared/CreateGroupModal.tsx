import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  chit_amount: z.coerce.number().min(1000, "Amount must be at least 1,000"),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month"),
  installment_amount: z.coerce.number().min(100, "Installment must be at least 100"),
  monthly_penalty_rate: z.coerce.number().min(0, "Penalty rate cannot be negative"),
  grace_period_days: z.coerce.number().min(0, "Grace period cannot be negative"),
  start_date: z.date(),
  penalty_calculation_mode: z.enum(["linear", "compounding"]),
  max_members: z.coerce.number().min(1, "Max members must be at least 1").max(100, "Max members limit is 100"),
});

export function CreateGroupModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-ignore
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      chit_amount: 500000,
      duration_months: 20,
      installment_amount: 25000,
      monthly_penalty_rate: 2.0,
      grace_period_days: 5,
      start_date: new Date(),
      penalty_calculation_mode: "linear",
      max_members: 30,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("chit_groups").insert({
        name: values.name,
        chit_amount: values.chit_amount,
        duration_months: values.duration_months,
        installment_amount: values.installment_amount,
        monthly_penalty_rate: values.monthly_penalty_rate,
        grace_period_days: values.grace_period_days,
        start_date: values.start_date.toISOString(),
        penalty_calculation_mode: values.penalty_calculation_mode as any,
        max_members: values.max_members,
        status: "active",
      });

      if (error) throw error;
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-2xl gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 display-font">
            Create Chit Group
          </DialogTitle>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alpha Fund 2023" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="chit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Chit Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="installment_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Installment (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="duration_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Duration (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="max_members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Max Members</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="monthly_penalty_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Penalty Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Grace Period (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="text-slate-900 font-semibold mb-1">Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal border-slate-300",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-slate-300 text-slate-900 font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
