export default function SectionHeader({ title, side }) {
  return (
    <div className="border-b border-gray-200 py-5 flex items-center justify-between">
      <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
      <div className="ml-4 mt-0">{side}</div>
    </div>
  );
}
