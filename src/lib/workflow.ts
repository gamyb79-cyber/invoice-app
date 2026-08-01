export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800", editable: true, description: "Work in progress" },
  { value: "quote", label: "Quote / Estimate", color: "bg-blue-100 text-blue-800", editable: true, description: "Price before work starts" },
  { value: "approved", label: "Approved Quote", color: "bg-indigo-100 text-indigo-800", editable: "limited", description: "Customer accepted the quote" },
  { value: "invoice", label: "Invoice", color: "bg-purple-100 text-purple-800", editable: "limited", description: "Official request for payment" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800", editable: false, description: "Payment date has passed" },
  { value: "partial", label: "Partially Paid", color: "bg-amber-100 text-amber-800", editable: false, description: "Customer paid some of the amount" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800", editable: false, description: "Invoice settled in full" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-200 text-gray-600", editable: false, description: "Invoice no longer valid" },
  { value: "credit", label: "Credit Note", color: "bg-cyan-100 text-cyan-800", editable: false, description: "Refund or correction" },
] as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[number]["value"];

export function getStatusConfig(status: string) {
  return INVOICE_STATUSES.find((s) => s.value === status) || INVOICE_STATUSES[0];
}

export function getStatusColor(status: string): string {
  return getStatusConfig(status).color;
}

export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

export function isEditable(status: string): boolean {
  const config = getStatusConfig(status);
  return config.editable === true || config.editable === "limited";
}

export function isFullyEditable(status: string): boolean {
  return getStatusConfig(status).editable === true;
}

export function getTransitions(status: string): { value: string; label: string; color: string; icon: string }[] {
  switch (status) {
    case "draft":
      return [
        { value: "quote", label: "Send as Quote", color: "bg-blue-600 hover:bg-blue-700", icon: "📋" },
        { value: "invoice", label: "Send as Invoice", color: "bg-purple-600 hover:bg-purple-700", icon: "📧" },
      ];
    case "quote":
      return [
        { value: "approved", label: "Mark as Approved", color: "bg-indigo-600 hover:bg-indigo-700", icon: "✅" },
        { value: "invoice", label: "Convert to Invoice", color: "bg-purple-600 hover:bg-purple-700", icon: "🔄" },
        { value: "cancelled", label: "Cancel Quote", color: "bg-gray-500 hover:bg-gray-600", icon: "❌" },
      ];
    case "approved":
      return [
        { value: "invoice", label: "Convert to Invoice", color: "bg-purple-600 hover:bg-purple-700", icon: "🔄" },
        { value: "cancelled", label: "Cancel", color: "bg-gray-500 hover:bg-gray-600", icon: "❌" },
      ];
    case "invoice":
      return [
        { value: "paid", label: "Mark as Paid", color: "bg-green-600 hover:bg-green-700", icon: "💰" },
        { value: "partial", label: "Mark Partially Paid", color: "bg-amber-600 hover:bg-amber-700", icon: "💵" },
        { value: "overdue", label: "Mark as Overdue", color: "bg-red-600 hover:bg-red-700", icon: "⏰" },
        { value: "cancelled", label: "Cancel Invoice", color: "bg-gray-500 hover:bg-gray-600", icon: "❌" },
      ];
    case "overdue":
      return [
        { value: "paid", label: "Mark as Paid", color: "bg-green-600 hover:bg-green-700", icon: "💰" },
        { value: "partial", label: "Mark Partially Paid", color: "bg-amber-600 hover:bg-amber-700", icon: "💵" },
        { value: "cancelled", label: "Cancel", color: "bg-gray-500 hover:bg-gray-600", icon: "❌" },
      ];
    case "partial":
      return [
        { value: "paid", label: "Mark as Fully Paid", color: "bg-green-600 hover:bg-green-700", icon: "💰" },
        { value: "overdue", label: "Mark as Overdue", color: "bg-red-600 hover:bg-red-700", icon: "⏰" },
        { value: "cancelled", label: "Cancel", color: "bg-gray-500 hover:bg-gray-600", icon: "❌" },
      ];
    case "paid":
      return [
        { value: "credit", label: "Issue Credit Note", color: "bg-cyan-600 hover:bg-cyan-700", icon: "📝" },
      ];
    case "cancelled":
      return [
        { value: "draft", label: "Reopen as Draft", color: "bg-gray-600 hover:bg-gray-700", icon: "🔄" },
      ];
    default:
      return [];
  }
}
