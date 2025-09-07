export default function MentorshipGroupsLanding() {
  const mentors = [
    { slug: 'avishek', label: 'mentor avishek' },
    { slug: 'shifat', label: 'mentor shifat' },
    { slug: 'adil', label: 'mentor adil' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">mentorship groups</h2>

      {mentors.map((m) => (
        <div key={m.slug} className="space-y-2">
          <div className="font-medium">{m.label}</div>
          <ul className="list-disc list-inside text-sm text-blue-700">
            <li>
              <a className="underline" href={`/mission-communication-hub/mentorship-groups/${m.slug}/announcements`}>announcement channel</a>
            </li>
            <li>
              <a className="underline" href={`/mission-communication-hub/mentorship-groups/${m.slug}/discussion`}>discussion channel</a>
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
}


