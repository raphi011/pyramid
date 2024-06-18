export default function Dropdown({ standings, selected, onChange }) {
  const handler = (event) => {
    const index = event.target.value;
    onChange(standings[index]);
  };

  return (
    <div className="flex w-full justify-end">
      <select
        id="date"
        name="date"
        className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 text-xs"
        defaultValue="-"
        onChange={handler}
      >
        {standings.map((s, i) => (
          <option value={i} key={s.date}>
            {new Date(s.date).toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
}
