import { SkeletonListPage } from "@/components/ui/skeleton";

export default function Loading() {
  return <SkeletonListPage stats={6} rows={8} cols={7} tabs={4} />;
}
