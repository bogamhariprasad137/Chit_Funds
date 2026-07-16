import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, IndianRupee, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { Database } from "@/types/supabase";

type ChitGroup = Database["public"]["Tables"]["chit_groups"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

const formSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  memberId: z.string().min(1, "Member is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  date: z.date(),
  mode: z.enum(["cash", "upi", "bank_transfer"]),
  remarks: z.string().optional(),
  penalty_override: z.coerce.number().optional(),
  override_reason: z.string().optional(),
}).refine(data => {
  if (data.penalty_override !== undefined && data.penalty_override >= 0 && !data.override_reason) {
    return false;
  }
  return true;
}, {
  message: "Override reason is required if penalty override is set",
  path: ["override_reason"]
});

export function RecordPaymentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<ChitGroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (open) {
      fetchGroups();
      fetchMembers();
    }
  }, [open]);

  async function fetchGroups() {
    const { data } = await supabase.from("chit_groups").select("*").eq("status", "active");
    if (data) setGroups(data);
  }

  async function fetchMembers() {
    const { data } = await supabase.from("members").select("*");
    if (data) setMembers(data);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-ignore
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      groupId: "",
      memberId: "",
      amount: undefined,
      date: new Date(),
      mode: "upi",
      remarks: "",
      penalty_override: undefined,
      override_reason: "",
    },
  });

  const selectedGroupId = form.watch("groupId");
  const filteredMembers = members.filter(m => m.group_id === selectedGroupId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // supabase.rpc arguments: p_member_id, p_installment_month, p_payment_mode, p_amount_paid, p_remarks, p_penalty_override, p_override_reason
      const { error, data } = await supabase.rpc("record_payment", {
        p_member_id: values.memberId,
        p_installment_month: format(values.date, "yyyy-MM-dd"), // ensure it's a date string
        p_payment_mode: values.mode as any,
        p_amount_paid: values.amount,
        p_remarks: (values.remarks || undefined) as any,
        p_penalty_override: (values.penalty_override !== undefined ? values.penalty_override : undefined) as any,
        p_override_reason: (values.override_reason || undefined) as any,
      });

      if (error) throw error;
      
      console.log("Payment recorded successfully:", data);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error recording payment:", error);
      alert(error.message || "Failed to record payment. Check constraints (e.g. Exact Amount Match).");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-2xl gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 display-font">
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">
            <FormField
              control={form.control as any}
              name="groupId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Group</FormLabel>
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("memberId", ""); // reset member when group changes
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus:border-slate-900 focus:ring-slate-900 h-11">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="memberId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroupId}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus:border-slate-900 focus:ring-slate-900 h-11">
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="amount"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 font-semibold">Total Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                          type="number"
                          placeholder="0.00" 
                          className="pl-9 border-slate-300 focus-visible:ring-slate-900 h-11 tabular-nums font-medium text-lg" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="date"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel className="text-slate-900 font-semibold mb-1">Installment Month</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-11 pl-3 text-left font-normal border-slate-300",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="mode"
              render={({ field }: { field: any }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-slate-900 font-semibold">Payment Mode</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "upi", label: "UPI" },
                        { id: "cash", label: "Cash" },
                        { id: "bank_transfer", label: "Bank Transfer" },
                      ].map((modeOption) => {
                        const isActive = field.value === modeOption.id;
                        return (
                          <button
                            key={modeOption.id}
                            type="button"
                            onClick={() => field.onChange(modeOption.id)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
                              isActive 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {modeOption.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="remarks"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any notes..." className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Penalty Override (Advanced)</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="penalty_override"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 text-xs">Custom Penalty Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" className="border-slate-300 h-9" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="override_reason"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 text-xs">Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Waived" className="border-slate-300 h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                Confirm Payment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
