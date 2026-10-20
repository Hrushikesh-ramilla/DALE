import type { Confirmation } from "@/domain/concierge";
export const confirmationCopy: Record<
  Confirmation["kind"],
  { title: string; action: string }
> = {
  checkout: {
    title: "Review your checkout",
    action: "Create PayPal approvals",
  },
  return: {
    title: "Review your return request",
    action: "Submit return request",
  },
  cancel: { title: "Review order cancellation", action: "Cancel unpaid order" },
  group_join: {
    title: "Review your group commitment",
    action: "Confirm group commitment",
  },
  group_leave: {
    title: "Review leaving this group",
    action: "Leave this group",
  },
  remedy: {
    title: "Review your resolution choice",
    action: "Confirm resolution choice",
  },
  appeal: {
    title: "Review your request for another review",
    action: "Submit request for review",
  },
  update_requirements: {
    title: "Review your shopping requirements",
    action: "Save shopping requirements",
  },
};
