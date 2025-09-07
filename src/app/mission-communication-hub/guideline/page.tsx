import PostList from "@/components/mission-communication-hub/PostList";

export default function GuidelinePage() {
  const posts = [
    { _id: "g1", title: "How to write better commits", category: "guideline" as const, status: "pending" },
    { _id: "g2", title: "Branch naming rules", category: "guideline" as const, status: "approved" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Guideline</h2>
      <PostList posts={posts} />
    </div>
  );
}


