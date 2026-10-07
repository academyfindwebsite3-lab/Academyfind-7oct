"use client";

import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useNotifyManager } from "./AdminNotifyManagerModal";
import {
  buildInstituteRequestLinks,
  buildInstituteRequestWhatsAppMessage,
  buildInstituteRequestWhatsAppUrl,
} from "@/lib/institutes/instituteRequestLinks";

export interface InstituteRequestData {
  id: string;
  instituteId: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  status: string;
  institute?: {
    id: string;
    name: string;
    slug?: string | null;
    city?: { name: string } | null;
  } | null;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface AdminRequestNotifyButtonProps {
  request: InstituteRequestData;
  className?: string;
}

export default function AdminRequestNotifyButton({
  request,
  className = "",
}: AdminRequestNotifyButtonProps) {
  const { openNotifyManager } = useNotifyManager();

  const phone = request.ownerPhone || request.user?.phone;
  const managerName = request.ownerName || request.user?.name || "Manager";
  const instituteName = request.institute?.name || "Your Institute";

  const { publicListingUrl, managerDashboardUrl } = buildInstituteRequestLinks(
    request.institute || { id: request.instituteId, name: instituteName }
  );

  const waMessage = buildInstituteRequestWhatsAppMessage({
    managerName,
    instituteName,
    publicListingUrl,
    managerDashboardUrl,
  });

  const waUrl = buildInstituteRequestWhatsAppUrl({
    phone,
    managerName,
    instituteName,
    publicListingUrl,
    managerDashboardUrl,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openNotifyManager({
      title: "Notify Manager",
      description: "Request is approved. Send confirmation & institute links to manager.",
      instituteName,
      managerName,
      phone,
      publicListingUrl,
      managerDashboardUrl,
      waUrl,
      waMessage,
      type: "INSTITUTE_REQUEST",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-900 transition shadow-xs cursor-pointer ${className}`}
      title="Notify manager on WhatsApp"
    >
      <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
      <span>Notify Manager</span>
    </button>
  );
}
