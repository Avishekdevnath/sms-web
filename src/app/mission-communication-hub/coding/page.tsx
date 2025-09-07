import PostList from "@/components/mission-communication-hub/PostList";

export default function CodingPage() {
  const posts = [
    { _id: "c1", title: "Two Sum solution", category: "coding" as const, status: "pending" },
    { _id: "c2", title: "Binary Search template", category: "coding" as const, status: "approved" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Coding</h2>
      <PostList posts={posts} />
    </div>
  );
}


