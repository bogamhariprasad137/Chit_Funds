import { useState, useEffect } from "react";
import { Loader2, X, User, Phone, MapPin, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";

interface AddMemberModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onMemberAdded?: () => void;
  onSuccess?: () => void;
}

export function AddMemberModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  onMemberAdded,
  onSuccess,
}: AddMemberModalProps) {
  const visible = open !== undefined ? open : (isOpen || false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [groupId, setGroupId] = useState("");
  
  const [groups, setGroups] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (visible) {
      fetchGroups();
      setName("");
      setPhone("");
      setAddress("");
      setGroupId("");
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const triggerSuccess = () => {
    if (onSuccess) onSuccess();
    if (onMemberAdded) onMemberAdded();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!name || name.trim().length < 3) {
        throw new Error("Name must be at least 3 characters long.");
      }
      
      let formattedPhone = phone.trim().replace(/[\s\-()]/g, "");
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.startsWith("91") && formattedPhone.length === 12) {
          formattedPhone = "+" + formattedPhone;
        } else if (formattedPhone.length === 10) {
          formattedPhone = "+91" + formattedPhone;
        } else {
          throw new Error("Invalid phone number length. Provide a 10-digit number or prefix with +91.");
        }
      }

      if (!/^\+91[6-9][0-9]{9}$/.test(formattedPhone)) {
        throw new Error("Phone number must be a valid Indian mobile number starting with +91 (e.g. +91 98765 43210).");
      }

      if (!groupId) {
        throw new Error("Please select a chit group pool.");
      }

      const { error: insertError } = await supabase.from("members").insert({
        name: name.trim(),
        phone: formattedPhone,
        address: address.trim() || null,
        group_id: groupId,
      });

      if (insertError) {
        if (insertError.message.includes("members_group_phone_unique")) {
          throw new Error("A member with this phone number is already registered in this group.");
        }
        throw insertError;
      }

      triggerSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Glass backdrop */}
      <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal Card */}
      <div className="bg-milk w-full max-w-[460px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20 text-plum font-body-md">
        
        {/* Header */}
        <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-milk">Enroll New Member</h3>
            <p className="text-[10px] text-milk/60 mt-0.5 font-bold font-geist">Insert a new record into your global database.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 hover:bg-milk/10 rounded-lg text-milk/80 hover:text-milk transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-plum text-milk text-xs font-bold p-4 rounded-lg border border-milk/10 shadow-milk-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Full Name</label>
            <div className="relative group">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk placeholder:text-plum/45"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Phone Number</label>
            <div className="relative group">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk font-mono placeholder:text-plum/45"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Address (Optional)</label>
            <div className="relative group">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Hyderabad, TS"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk placeholder:text-plum/45"
              />
            </div>
          </div>

          {/* Chit Group Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Assign Chit Group</label>
            <div className="relative group">
              <Landmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="">Select an active chit pool</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Value: {formatCurrency(g.chit_amount)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 btn-milk"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 btn-plum flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  Creating Record...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Enroll Member"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
