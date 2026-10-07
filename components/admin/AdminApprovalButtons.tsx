"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { approveInstituteRequest, rejectInstituteRequest } from "@/lib/User/admin/adminApprovalInstitute";
import toast from "react-hot-toast";
import { useNotifyManager } from "@/components/admin/AdminNotifyManagerModal";
import { formatWhatsAppNumber } from "@/lib/institutes/claimLinks";

// 🚀 Shadcn UI Elements Import (Inhe installed rakhein)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface ApprovalButtonsProps {
  requestId: string;
  request?: any;
}

export default function ApprovalButtons({ requestId, request }: ApprovalButtonsProps) {
    const [isPending, setIsPending] = useState(false);
    const { openNotifyManager } = useNotifyManager();
    // Dialog state management manually control karne ke liye
    const [openType, setOpenType] = useState<"APPROVE" | "REJECT" | null>(null);

    const handleAction = async () => {
        if (!openType) return;
        
        const actionType = openType;
        setOpenType(null); // Dialog ko pehle close kar dete hain smooth transition ke liye
        setIsPending(true);
        
        const res = actionType === "APPROVE" 
            ? await approveInstituteRequest(requestId)
            : await rejectInstituteRequest(requestId);

        if (res.success) {
            toast.success(res.message || "Operation executed!");

            if (actionType === "APPROVE") {
                const targetPhone = res.phone || request?.ownerPhone || request?.user?.phone || request?.institute?.phone;
                const cleanPhone = formatWhatsAppNumber(targetPhone);
                const waUrl = cleanPhone && res.waMessage 
                    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(res.waMessage)}`
                    : "";

                openNotifyManager({
                    title: "Notify Manager",
                    description: "Request is approved. Send confirmation & institute links to manager.",
                    instituteName: res.instituteName || request?.institute?.name || "Institute",
                    managerName: res.managerName || request?.ownerName || request?.user?.name || "Manager",
                    phone: targetPhone,
                    publicListingUrl: res.publicListingUrl,
                    managerDashboardUrl: res.managerDashboardUrl,
                    waUrl,
                    waMessage: res.waMessage,
                    type: "INSTITUTE_REQUEST",
                });
            }
        } else {
            toast.error(res.error || "Execution error.");
        }
        setIsPending(false);
    };

    return (
        <div className="flex items-center gap-3">
            {/* --- REJECT CONTAINER WITH CUSTOM DIALOG --- */}
            <AlertDialog open={openType === "REJECT"} onOpenChange={(isOpen) => !isOpen && setOpenType(null)}>
                <AlertDialogTrigger asChild>
                    <Button 
                        disabled={isPending}
                        onClick={() => setOpenType("REJECT")}
                        variant="outline" 
                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 px-4 font-bold text-xs gap-1.5"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject Request
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl max-w-md font-sans">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 font-bold text-lg">Reject Submission?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                            Are you absolutely sure you want to reject this request? This action will permanently delete this draft data from the staging systems and Meilisearch.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-2">
                        <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-700 font-semibold text-xs px-4">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleAction}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 shadow-sm"
                        >
                            Confirm Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* --- APPROVE CONTAINER WITH CUSTOM DIALOG --- */}
            <AlertDialog open={openType === "APPROVE"} onOpenChange={(isOpen) => !isOpen && setOpenType(null)}>
                <AlertDialogTrigger asChild>
                    <Button 
                        disabled={isPending}
                        onClick={() => setOpenType("APPROVE")}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 font-bold text-xs gap-1.5 shadow-sm"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve & Launch
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl max-w-md font-sans">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 font-bold text-lg">Approve & Publish Institute?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                            This will instantly activate the listing profile, assign managers if claimed, and push the clean dataset directly to global search indexes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-2">
                        <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-700 font-semibold text-xs px-4">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleAction}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 shadow-sm"
                        >
                            Confirm & Go Live
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
