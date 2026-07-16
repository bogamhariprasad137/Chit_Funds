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
  releaseMonth: z.date(),
  mode: z.enum(["cash", "upi", "bank_transfer"]),
  remarks: z.string().optional(),
});

export function RecordReleaseModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
      releaseMonth: new Date(),
      mode: "bank_transfer",
      remarks: "",
    },
  });

  const selectedGroupId = form.watch("groupId");
  const filteredMembers = members.filter(m => m.group_id === selectedGroupId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("chit_releases").insert({
        group_id: values.groupId,
        member_id: values.memberId,
        release_month: format(values.releaseMonth, "yyyy-MM-01"),
        amount: values.amount,
        payment_mode: values.mode as any,
        remarks: values.remarks || null,
      });

      if (error) throw error;
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error recording release:", error);
      alert(error.message || "Failed to record release.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-2xl gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 display-font">
            Record Chit Release
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
                    form.setValue("memberId", "");
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
                  <FormLabel className="text-slate-900 font-semibold">Winner (Member)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroupId}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus:border-slate-900 focus:ring-slate-900 h-11">
                        <SelectValue placeholder="Select winner" />
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
                    <FormLabel className="text-slate-900 font-semibold">Release Amount</FormLabel>
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
                name="releaseMonth"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel className="text-slate-900 font-semibold mb-1">Release Month</FormLabel>
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
                              format(field.value, "MMM yyyy")
                            ) : (
                              <span>Pick month</span>
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
                  <FormLabel className="text-slate-900 font-semibold">Payout Mode</FormLabel>
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
                Confirm Release
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
