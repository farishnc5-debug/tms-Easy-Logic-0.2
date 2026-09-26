import { SkeletonListPage } from "@/components/ui/skeleton";

export default function Loading() {
  return <SkeletonListPage stats={4} rows={8} cols={5} tabs={0} />;
}
