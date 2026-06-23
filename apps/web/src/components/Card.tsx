export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      {title && (
        <div className="px-5 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}