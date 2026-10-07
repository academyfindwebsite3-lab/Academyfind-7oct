"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  PhoneCall,
  Mail,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import { updateClaimStatus } from "@/lib/User/admin/adminClaim";
import { deleteClaimAction } from "@/app/(af-ass-manage)/af-ass-manage/claims/actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  buildApprovalLinks,
  buildApprovalWhatsAppMessage,
  buildApprovalWhatsAppUrl,
} from "@/lib/institutes/claimLinks";
import { ClaimData } from "./AdminClaimRowActions";
import { useNotifyManager } from "./AdminNotifyManagerModal";

interface AdminClaimDetailActionsProps {
  claim: ClaimData & {
    userId?: string;
    role?: string;
    message?: string | null;
    createdAt?: any;
    updatedAt?: any;
  };
}

export default function AdminClaimDetailActions({ claim }: AdminClaimDetailActionsProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(claim.status);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { openNotifyManager } = useNotifyManager();

  const waUrl = buildApprovalWhatsAppUrl(claim);
  const waMessage = buildApprovalWhatsAppMessage(claim);
  const { publicListingUrl, managerDashboardUrl } = buildApprovalLinks(claim);

  const handleOpenNotifyModal = () => {
    openNotifyManager({
      title: "Notify Institute Manager",
      description: "Send official approval notice, public profile URL, and manager dashboard link.",
      instituteName: claim.institute?.name || "Institute",
      managerName: claim.fullName,
      phone: claim.phone,
      publicListingUrl,
      managerDashboardUrl,
      waUrl,
      waMessage,
      type: "CLAIM",
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await updateClaimStatus(claim.id, "APPROVED");
      if (res && res.success) {
        toast.success("Claim approved successfully! 🎉");
        setCurrentStatus("APPROVED");
        router.refresh();
        handleOpenNotifyModal();
      } else {
        toast.error((res as any)?.error || "Failed to approve claim");
      }
    } catch (err: any) {
      console.error("Error approving claim:", err);
      toast.error("Failed to approve claim");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectConfirm = async () => {
    setIsRejecting(true);
    try {
      const res = await updateClaimStatus(claim.id, "REJECTED");
      if (res && res.success) {
        toast.success("Claim marked as rejected");
        setCurrentStatus("REJECTED");
        router.refresh();
      } else {
        toast.error((res as any)?.error || "Failed to reject claim");
      }
    } catch (err: any) {
      console.error("Error rejecting claim:", err);
      toast.error("Failed to reject claim");
    } finally {
      setIsRejecting(false);
      setIsRejectConfirmOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteClaimAction(claim.id);
      if (res.success) {
        toast.success("Claim deleted successfully");
        router.push("/af-ass-manage/claims");
      } else {
        toast.error(res.error || "Failed to delete claim");
      }
    } catch (err: any) {
      console.error("Error deleting claim:", err);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Approve / Reject / WhatsApp Actions */}
        {currentStatus === "PENDING" && (
          <>
            <button
              type="button"
              onClick={() => setIsRejectConfirmOpen(true)}
              disabled={isApproving || isRejecting || isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Claim</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || isRejecting || isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isApproving ? "Approving..." : "Approve Claim"}</span>
            </button>
          </>
        )}

        {currentStatus === "APPROVED" && (
          <>
            <button
              type="button"
              onClick={handleOpenNotifyModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 hover:text-emerald-900 transition-all shadow-xs cursor-pointer"
            >
              <FaWhatsapp className="w-4 h-4 text-[#25D366]" />
              <span>Notify Manager via WhatsApp</span>
            </button>
            <a
              href={managerDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Manager Dashboard</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
            </a>
          </>
        )}

        {currentStatus === "REJECTED" && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={isApproving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-xs cursor-pointer"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Re-Approve Claim</span>
          </button>
        )}

        {/* Delete Claim Button */}
        <button
          type="button"
          onClick={() => setIsDeleteConfirmOpen(true)}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-500 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Delete Claim Request"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>Delete</span>
        </button>
      </div>

      {/* Reject Confirmation */}
      <ConfirmModal
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Claim Request?"
        description={`Are you sure you want to reject the ownership claim for ${
          claim.institute?.name || "this institute"
        } submitted by ${claim.fullName}? The status will be set to REJECTED.`}
        confirmText="Yes, Reject"
        destructive={true}
        loading={isRejecting}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Claim Request Permanently?"
        description={`Are you sure you want to permanently delete this claim request from ${claim.fullName}? This action cannot be undone.`}
        confirmText="Yes, Delete Permanently"
        destructive={true}
        loading={isDeleting}
      />
    </>
  );
}
