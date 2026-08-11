import CustomerDetailPage from "@/components/customers/customer-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailPage id={id} isVendor={false} />;
}
