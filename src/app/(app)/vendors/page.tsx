import CustomerListPage from "@/components/customers/customer-list-page";

export const dynamic = "force-dynamic";

export default function VendorsPage() {
  return <CustomerListPage isVendor={true} />;
}
