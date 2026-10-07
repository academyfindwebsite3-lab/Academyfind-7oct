"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { ExternalLink, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatWhatsAppNumber } from "@/lib/institutes/claimLinks";

export interface NotifyManagerData {
  title?: string;
  description?: string;
  instituteName: string;
  managerName?: string | null;
  phone?: string | null;
  publicListingUrl?: string | null;
  managerDashboardUrl?: string | null;
  waUrl?: string | null;
  waMessage?: string | null;
  type?: "CLAIM" | "INSTITUTE_REQUEST" | "GENERAL";
}

interface NotifyManagerContextType {
  openNotifyManager: (data: NotifyManagerData) => void;
  closeNotifyManager: () => void;
  isOpen: boolean;
  data: NotifyManagerData | null;
}

const NotifyManagerContext = createContext<NotifyManagerContextType>({
  openNotifyManager: () => {},
  closeNotifyManager: () => {},
  isOpen: false,
  data: null,
});

export function useNotifyManager() {
  return useContext(NotifyManagerContext);
}

// Global dispatch helper that can be called anywhere (even outside of React component trees)
export function triggerNotifyManager(data: NotifyManagerData) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("academyfind:open-notify-manager", { detail: data })
    );
  }
}

export function AdminNotifyProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<NotifyManagerData | null>(null);

  const openNotifyManager = useCallback((newData: NotifyManagerData) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const closeNotifyManager = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Listen for global custom events
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NotifyManagerData>;
      if (customEvent.detail) {
        openNotifyManager(customEvent.detail);
      }
    };

    window.addEventListener("academyfind:open-notify-manager", handleEvent);
    return () => {
      window.removeEventListener("academyfind:open-notify-manager", handleEvent);
    };
  }, [openNotifyManager]);

  return (
    <NotifyManagerContext.Provider
      value={{ openNotifyManager, closeNotifyManager, isOpen, data }}
    >
      {children}
    </NotifyManagerContext.Provider>
  );
}

export function AdminNotifyManagerModal() {
  const { isOpen, closeNotifyManager, data } = useNotifyManager();
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const phone = data.phone || "";
  const cleanPhone = formatWhatsAppNumber(phone);
  const managerName = data.managerName || "Manager";
  const instituteName = data.instituteName || "Institute";
  const publicListingUrl = data.publicListingUrl || "";
  const managerDashboardUrl = data.managerDashboardUrl || "";

  // Resolved WhatsApp Message
  const resolvedMessage =
    data.waMessage ||
    `🎉 *Congratulations ${managerName}!*

We are pleased to inform you that your request for *${instituteName}* has been officially verified & *APPROVED* on AcademyFind!

You now have full manager access to your profile:

${publicListingUrl ? `🌐 *View Your Public Listing:*\n${publicListingUrl}\n\n` : ""}${
      managerDashboardUrl ? `📊 *Access Manager Dashboard:*\n${managerDashboardUrl}\n\n` : ""
    }*What you can do in your dashboard:*
✅ Update institute info, courses, & fee structure
✅ Add batches, facilities & gallery photos
✅ View student enquiry leads & callbacks
✅ Respond to student reviews

If you need any assistance, feel free to reply directly to this message.

Best Regards,
*Team AcademyFind*
🌐 www.academyfind.com`;

  // Resolved WhatsApp URL
  const resolvedWaUrl =
    data.waUrl ||
    (cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
          resolvedMessage
        )}`
      : "");

  const handleOpenWhatsApp = () => {
    if (resolvedWaUrl) {
      window.open(resolvedWaUrl, "_blank");
      closeNotifyManager();
    } else {
      toast.error("No valid mobile phone number available for WhatsApp.");
    }
  };

  const handleCopyMessage = () => {
    if (!resolvedMessage) return;
    navigator.clipboard.writeText(resolvedMessage);
    setCopied(true);
    toast.success("WhatsApp message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeNotifyManager()}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-xl font-sans"
      >
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900 leading-tight">
                {data.title || "Notify Manager"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {data.description ||
                  "Request is approved. Send confirmation & institute links to manager."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Details Card */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
          <div className="font-bold text-slate-900 text-sm leading-snug">
            {instituteName}
          </div>
          <div className="text-slate-500">
            Manager: <span className="font-semibold text-slate-700">{managerName}</span>{" "}
            {phone ? `(${phone})` : "(No phone)"}
          </div>

          {(publicListingUrl || managerDashboardUrl) && (
            <div className="pt-2 mt-2 border-t border-slate-200/60 space-y-1 text-[11px]">
              {publicListingUrl && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Public Listing:</span>
                  <a
                    href={publicListingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Profile <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {managerDashboardUrl && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Manager Dashboard:</span>
                  <a
                    href={managerDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <p className="text-slate-500 pt-1 text-[11px] leading-relaxed">
            Click below to send their public listing and dashboard links directly on WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Copy WhatsApp Message"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeNotifyManager}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-4 cursor-pointer"
            >
              Close
            </Button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
