export default function CommGroupsPage() {
  const groups = [
    { _id: "gA", name: "Mentor Avishek - Group A", students: 24 },
    { _id: "gB", name: "Mentor Shifat - Group B", students: 22 },
    { _id: "gC", name: "Recovery Zone", students: 5 },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Groups</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(g => (
          <div key={g._id} className="p-4 border rounded">
            <div className="font-medium">{g.name}</div>
            <div className="text-sm text-gray-500">{g.students} students</div>
          </div>
        ))}
      </div>
    </div>
  );
}


