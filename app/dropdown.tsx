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
            {s.latest ? "Aktuell" : formatDate(new Date(s.date))}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
