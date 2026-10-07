import {
  formatWhatsAppNumber,
  buildApprovalLinks,
  buildApprovalWhatsAppMessage,
  buildApprovalWhatsAppUrl,
} from "@/lib/institutes/claimLinks";
import {
  buildInstituteRequestLinks,
  buildInstituteRequestWhatsAppMessage,
  buildInstituteRequestWhatsAppUrl,
} from "@/lib/institutes/instituteRequestLinks";
import { triggerNotifyManager } from "@/components/admin/AdminNotifyManagerModal";

// Polyfill window and CustomEvent if running in Node environment
if (typeof window === "undefined") {
  const listeners: Record<string, Function[]> = {};
  (global as any).window = {
    location: {
      origin: "https://www.academyfind.com",
    },
    addEventListener: (type: string, cb: Function) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(cb);
    },
    removeEventListener: (type: string, cb: Function) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((fn) => fn !== cb);
      }
    },
    dispatchEvent: (event: any) => {
      if (listeners[event.type]) {
        listeners[event.type].forEach((fn) => fn(event));
      }
      return true;
    },
  };
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

describe("Admin Notify Manager & Approval Links", () => {
  describe("formatWhatsAppNumber", () => {
    it("should format 10-digit phone number with 91 country code prefix", () => {
      expect(formatWhatsAppNumber("9876543210")).toBe("919876543210");
    });

    it("should strip leading 0 and format with 91 prefix", () => {
      expect(formatWhatsAppNumber("09876543210")).toBe("919876543210");
    });

    it("should preserve numbers already having country code", () => {
      expect(formatWhatsAppNumber("919876543210")).toBe("919876543210");
    });

    it("should strip spaces, dashes and brackets", () => {
      expect(formatWhatsAppNumber("+91 (98765) 43210")).toBe("919876543210");
    });

    it("should return empty string for null or empty input", () => {
      expect(formatWhatsAppNumber(null)).toBe("");
      expect(formatWhatsAppNumber(undefined)).toBe("");
      expect(formatWhatsAppNumber("")).toBe("");
    });
  });

  describe("Claim Approval Links & WhatsApp URL", () => {
    const mockClaim = {
      id: "claim_123",
      fullName: "Sharma Ji",
      phone: "9876543210",
      institute: {
        id: "inst_456",
        name: "Apex IIT Academy",
        slug: "apex-iit-academy",
      },
    };

    it("should generate valid public listing and dashboard URLs", () => {
      const links = buildApprovalLinks(mockClaim);
      expect(links.publicListingUrl).toContain("/institute/inst_456-apex-iit-academy");
      expect(links.managerDashboardUrl).toContain("/manager/inst_456");
    });

    it("should generate WhatsApp message containing manager name and institute", () => {
      const message = buildApprovalWhatsAppMessage(mockClaim);
      expect(message).toContain("Sharma Ji");
      expect(message).toContain("Apex IIT Academy");
      expect(message).toContain("APPROVED");
      expect(message).toContain("/institute/inst_456-apex-iit-academy");
      expect(message).toContain("/manager/inst_456");
    });

    it("should generate WhatsApp URL with valid phone number and encoded message", () => {
      const waUrl = buildApprovalWhatsAppUrl(mockClaim);
      expect(waUrl).toContain("phone=919876543210");
      expect(waUrl).toContain("https://api.whatsapp.com/send?");
      expect(waUrl).toContain(encodeURIComponent("Sharma Ji"));
    });
  });

  describe("Institute New Registration (Request) Links & WhatsApp URL", () => {
    const mockInstitute = {
      id: "inst_789",
      name: "FAST Eduventures",
      slug: "fast-eduventures-gaur-city",
    };

    it("should generate valid public listing and dashboard URLs for institute request", () => {
      const links = buildInstituteRequestLinks(mockInstitute);
      expect(links.publicListingUrl).toContain("/institute/inst_789-fast-eduventures-gaur-city");
      expect(links.managerDashboardUrl).toContain("/manager/inst_789");
    });

    it("should generate WhatsApp message for institute request approval", () => {
      const { publicListingUrl, managerDashboardUrl } = buildInstituteRequestLinks(mockInstitute);
      const message = buildInstituteRequestWhatsAppMessage({
        managerName: "Fast Official",
        instituteName: "FAST Eduventures",
        publicListingUrl,
        managerDashboardUrl,
      });

      expect(message).toContain("Fast Official");
      expect(message).toContain("FAST Eduventures");
      expect(message).toContain("APPROVED");
      expect(message).toContain(publicListingUrl);
      expect(message).toContain(managerDashboardUrl);
    });

    it("should generate WhatsApp URL for institute request", () => {
      const { publicListingUrl, managerDashboardUrl } = buildInstituteRequestLinks(mockInstitute);
      const waUrl = buildInstituteRequestWhatsAppUrl({
        phone: "7007273922",
        managerName: "Fast Official",
        instituteName: "FAST Eduventures",
        publicListingUrl,
        managerDashboardUrl,
      });

      expect(waUrl).toContain("phone=917007273922");
      expect(waUrl).toContain("https://api.whatsapp.com/send?");
      expect(waUrl).toContain(encodeURIComponent("FAST Eduventures"));
    });
  });

  describe("triggerNotifyManager event dispatch", () => {
    it("should dispatch custom event on window if in browser environment", () => {
      const eventListener = jest.fn();
      // Setup mock window event listener
      window.addEventListener("academyfind:open-notify-manager", eventListener);

      const payload = {
        title: "Notify Manager",
        description: "Request is approved.",
        instituteName: "FAST Eduventures",
        managerName: "Fast Official",
        phone: "7007273922",
        publicListingUrl: "https://www.academyfind.com/institute/inst_789",
        managerDashboardUrl: "https://www.academyfind.com/manager/inst_789",
      };

      triggerNotifyManager(payload);

      expect(eventListener).toHaveBeenCalledTimes(1);
      const customEvent = eventListener.mock.calls[0][0] as CustomEvent;
      expect(customEvent.detail).toEqual(payload);

      window.removeEventListener("academyfind:open-notify-manager", eventListener);
    });
  });
});
