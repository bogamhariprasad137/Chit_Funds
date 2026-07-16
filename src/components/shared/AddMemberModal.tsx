import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import type { Database } from "@/types/supabase";

type ChitGroup = Database["public"]["Tables"]["chit_groups"]["Row"];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  address: z.string().optional(),
  group_id: z.string().min(1, "Please select a group"),
});

export function AddMemberModal({
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

  useEffect(() => {
    async function fetchGroups() {
      const { data } = await supabase
        .from("chit_groups")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (data) {
        setGroups(data);
      }
    }
    if (open) {
      fetchGroups();
    }
  }, [open]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      group_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("members").insert({
        name: values.name,
        phone: values.phone,
        address: values.address || null,
        group_id: values.group_id,
      });

      if (error) throw error;
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-2xl gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 display-font">
            Add New Member
          </DialogTitle>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Rajesh Kumar" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +91 9876543210" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Main St" className="border-slate-300 focus-visible:ring-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-semibold">Assign to Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300 focus-visible:ring-slate-900">
                        <SelectValue placeholder="Select a chit group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                Add Member
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
