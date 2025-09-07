import PostList from "@/components/mission-communication-hub/PostList";

export default function ResourcesPage() {
  const posts = [
    { _id: "r1", title: "React Docs", category: "resource" as const },
    { _id: "r2", title: "TypeScript Handbook", category: "resource" as const },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resources</h2>
      <PostList posts={posts} />
    </div>
  );
}


