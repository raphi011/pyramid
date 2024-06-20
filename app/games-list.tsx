import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/table";
import { Badge } from "./components/badge";
import { formatDate } from "./date";

export default function GamesList({ games }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Forderer</TableHeader>
          <TableHeader>Geforderter</TableHeader>
          <TableHeader>Gefordert am</TableHeader>
          <TableHeader>Ergebnis</TableHeader>
          <TableHeader>Ergebnis</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {games.map((g) => (
          <TableRow key={g.handle}>
            <TableCell className="font-medium">{g.player1.name}</TableCell>
            <TableCell className="font-medium">{g.player2.name}</TableCell>
            <TableCell>{formatDate(new Date(g.created))}</TableCell>
            <TableCell>6:1 6:3</TableCell>
            <TableCell className="text-zinc-500">
              <Badge color="green">Gewonnen</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
