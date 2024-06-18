export default function Dropdown({ standings, selected, onChange }) {
  const handler = (event) => {
    const index = event.target.value;
    onChange(standings[index]);
  };

  return (
    <div>
      <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
        Location
      </label>
      <select
        id="date"
        name="date"
        className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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